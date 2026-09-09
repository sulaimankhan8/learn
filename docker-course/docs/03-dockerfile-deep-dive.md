# 📜 Deep Dive: Dockerfile Directives & Build Engine

## 1. Directive Breakdown

```dockerfile
# 1. Base Image definition
FROM node:20-alpine

# 2. Build Arguments (Available ONLY during image build)
ARG NODE_ENV=production

# 3. Runtime Environment Variables (Persisted in container runtime)
ENV PORT=3000 \
    NODE_ENV=${NODE_ENV}

# 4. Set working directory (Creates directory if missing)
WORKDIR /usr/src/app

# 5. Copy package declarations first for layer caching
COPY package*.json ./

# 6. Execute shell commands during build
RUN npm ci --omit=dev && npm cache clean --force

# 7. Copy application code
COPY . .

# 8. Switch from default 'root' user to unprivileged user
USER node

# 9. Document expected exposed port (Does NOT publish to host automatically!)
EXPOSE 3000

# 10. Container Healthcheck mechanism
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 11. Process execution target
CMD ["node", "src/server.js"]
```

---

## 2. Key Conceptual Distinctions

### A. `RUN` vs `CMD` vs `ENTRYPOINT`

| Directive | Execution Time | Purpose | Overridable at runtime? |
|---|---|---|---|
| `RUN` | **Build Time** | Installs packages, creates directories, compiles code. Creates a new image layer. | N/A |
| `CMD` | **Runtime** | Default command/arguments passed to container process. | **YES** (`docker run my-image npm test`) |
| `ENTRYPOINT`| **Runtime** | Fixed binary/executable that container is designed to run. | Only with `--entrypoint` flag |

#### The Recommended Pattern:
Combine `ENTRYPOINT` (fixed binary) with `CMD` (default arguments):
```dockerfile
ENTRYPOINT ["node"]
CMD ["src/server.js"]
```
- Running `docker run my-app` executes `node src/server.js`.
- Running `docker run my-app script/migrate.js` executes `node script/migrate.js`.

---

### B. `COPY` vs `ADD`

- **`COPY`**: Copies local files/directories from host into container image. Always use `COPY` by default.
- **`ADD`**: Can extract local tarballs automatically (`ADD archive.tar.gz /opt/`) and download remote URLs (discouraged; use `RUN curl` or `wget` to keep layers clean).

---

### C. `ENV` vs `ARG`

```text
                 DOCKER BUILD PHASE                 DOCKER RUNTIME PHASE
                ┌──────────────────┐                ┌─────────────────────┐
 ARG BUILD_VER ─┤ Available inside ├─ Cannot be seen │                     │
                │ Dockerfile build │                │                     │
                └──────────────────┘                │                     │
                                                    │                     │
 ENV DB_HOST   ─────────────────────────────────────┤ Persists inside live│
                                                    │ container process   │
                                                    └─────────────────────┘
```

---

## 3. The `.dockerignore` Contract
Never build an image without `.dockerignore`. Omitting it sends gigabytes of unnecessary local files into the Docker build context and can leak sensitive secrets.

```text
# Standard Node.js .dockerignore
node_modules
npm-debug.log
.git
.gitignore
.env*
Dockerfile*
docker-compose*
coverage
dist/temp
.vscode
.idea
README.md
```
