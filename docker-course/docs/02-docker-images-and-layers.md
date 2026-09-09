# 🧬 Deep Dive: Images, Layers & Union Filesystem (Overlay2)

## 1. How Images Actually Work
A Docker image is an ordered collection of **read-only layers**, each representing one or more filesystem changes (added files, modified files, deleted files).

```text
 ┌─────────────────────────────────────────────────────────────┐
 │ CONTAINER (Read-Write Layer)                                │ <── Ephemeral runtime changes
 ├─────────────────────────────────────────────────────────────┤
 │ Layer 4: CMD ["node", "server.js"]            (0 B)         │ <── Metadata instruction
 ├─────────────────────────────────────────────────────────────┤
 │ Layer 3: COPY . /app                          (2.1 MB)      │ <── Application source
 ├─────────────────────────────────────────────────────────────┤
 │ Layer 2: RUN npm install --production         (48.5 MB)     │ <── Node dependencies
 ├─────────────────────────────────────────────────────────────┤
 │ Layer 1: FROM node:20-alpine                  (130 MB)      │ <── Base OS + Node runtime
 └─────────────────────────────────────────────────────────────┘
```

---

## 2. UnionFS & Overlay2 Mechanics

Docker uses **Overlay2** as its default storage driver on modern Linux. Overlay2 merges multiple directories into a single unified filesystem view:

1. **LowerDir (Read-Only)**: The stacked immutable layers of the Docker image.
2. **UpperDir (Read-Write)**: The container's private writeable layer.
3. **MergedDir (Unified View)**: What the containerized process sees when running `ls /`.
4. **WorkDir**: Internal scratchpad used by Linux kernel to prepare merged files.

### Copy-on-Write (CoW) Strategy
- **Reading a file**: The kernel searches from UpperDir down through LowerDir layers. The first match is returned.
- **Modifying an existing file**: The file is copied from LowerDir up to UpperDir before modification happens. The original image layer remains 100% untouched.
- **Deleting a file**: A special *whiteout* character file is written into UpperDir to hide the file from MergedDir.

---

## 3. Base Image Choices: Alpine vs Debian vs Distroless

| Base Image | Size | Standard C Library | Shell Included? | Package Manager | Recommended For |
|---|---|---|---|---|---|
| `node:20` (Debian Bookworm) | ~1.1 GB | `glibc` | Yes (`bash`) | `apt` | Complex native C++ addons (`sharp`, `canvas`, `node-gyp`) |
| `node:20-slim` | ~200 MB | `glibc` | Yes (`bash`/`sh`) | `apt` | General production Node.js backends |
| `node:20-alpine` | ~135 MB | `musl` | Yes (`sh`) | `apk` | Lightweight microservices (check musl compatibility) |
| `gcr.io/distroless/nodejs20` | ~150 MB | `glibc` | **NO** | None | Maximum security production runtime |

---

## 4. Layer Caching & Build Invalidation

Docker checks its build cache sequentially from top to bottom. If any layer changes, **all subsequent layers are invalidated**:

```dockerfile
# ❌ BAD PRACTICE (Cache busted on EVERY code change)
FROM node:20-alpine
WORKDIR /app
COPY . .                      # <── Edits to server.js bust cache here!
RUN npm install               # <── Forced to re-download 200MB packages every build!
CMD ["node", "server.js"]

# ✅ OPTIMIZED PRACTICE
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./         # <── Only invalidates if package.json changes!
RUN npm ci --only=production  # <── CACHED across 99% of code changes!
COPY . .                      # <── Fast copy of source code
CMD ["node", "server.js"]
```

---

## 5. Image Inspection Commands

```bash
# Inspect layer sizes and instructions
docker history my-app:1.0.0

# Low-level layer hash analysis
docker inspect --format='{{json .RootFS.Layers}}' my-app:1.0.0
```
