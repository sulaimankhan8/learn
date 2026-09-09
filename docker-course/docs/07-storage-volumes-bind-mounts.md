# 💾 Deep Dive: Storage, Volumes & Bind Mounts

## 1. Storage Comparison Matrix

```text
┌────────────────────┬─────────────────────────────┬───────────────────────────────┬────────────────────────────┐
│ Feature            │ Named Volumes               │ Bind Mounts                   │ tmpfs Mounts               │
├────────────────────┼─────────────────────────────┼───────────────────────────────┼────────────────────────────┤
│ Location           │ Managed by Docker           │ Any file/directory on Host    │ Host RAM (System Memory)   │
│                    │ (`/var/lib/docker/volumes/`)│ (`c:/Users/...` or `/home/..`)│ (Never written to disk)    │
├────────────────────┼─────────────────────────────┼───────────────────────────────┼────────────────────────────┤
│ Lifecycle          │ Independent of containers   │ Dependent on host directory   │ Destroyed when stopped     │
├────────────────────┼─────────────────────────────┼───────────────────────────────┼────────────────────────────┤
│ Best Used For      │ Production DBs (Mongo/Redis)│ Local live-reload development │ Sensitive tokens, session  │
│                    │ & persistent state          │ & config file injection       │ cache, ultra-fast I/O      │
└────────────────────┴─────────────────────────────┴───────────────────────────────┴────────────────────────────┘
```

---

## 2. Named Volumes (Production Persistence)

When MongoDB writes to `/data/db`, standard container execution writes to the writeable layer. When that container is removed (`docker rm`), that data is permanently deleted.

```text
       CONTAINER LIFECYCLE WITHOUT VOLUMES:
       Container Created ──> Writes data to /data/db ──> Container Destroyed ──> 🔥 DATA GONE
       
       CONTAINER LIFECYCLE WITH NAMED VOLUMES:
       Named Volume: "mongo-data" (Managed Storage)
              ▲
              │ Mounted at /data/db
       Container A (writes data) ──> Container A Destroyed ──> Container B Attached ──> ✅ DATA INTACT
```

### Command Syntax:
```bash
# Create named volume explicitly
docker volume create mongo-storage

# Run container mounted to named volume
docker run -d --name db-instance -v mongo-storage:/data/db mongo:7.0

# Inspect volume location
docker volume inspect mongo-storage
```

---

## 3. Bind Mounts (Local Development Workflow)

Bind mounts mirror an absolute path on your host into the container filesystem:

```bash
# Mount current directory into /app inside container for live-reloading
docker run -d -p 3000:3000 \
  -v "$(pwd)":/app \
  -v /app/node_modules \
  --name node-dev-app node:20-alpine npm run dev
```

> **Notice the trick: `-v /app/node_modules`**
> This anonymous volume preserves the container's Linux-compiled `node_modules` and prevents your host machine's OS-specific `node_modules` from overwriting it!
