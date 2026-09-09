# 🧪 Lab 07: Storage Persistence with Named Volumes & Bind Mounts

## 🎯 Objectives
1. Prove data loss upon container deletion without volumes.
2. Persist data across container lifecycles using Named Volumes.
3. Use Bind Mounts for live code development.

---

## 🔬 Hands-on Lab Steps

### 1. Proof of State Loss (Without Volume)
```bash
docker run -d --name temp-db alpine sh -c "echo 'critical-data' > /data.txt; sleep 3600"
docker rm -f temp-db

# Launch new instance
docker run --rm alpine cat /data.txt
# ❌ Result: No such file or directory
```

### 2. Persistent Named Volume
```bash
# Create Volume
docker volume create app-storage

# Run container mounted to volume
docker run -d --name writer-box -v app-storage:/persisted alpine sh -c "echo 'permanent-data-2026' > /persisted/log.txt; sleep 3600"
docker rm -f writer-box

# Read from newly created container attached to same volume
docker run --rm -v app-storage:/persisted alpine cat /persisted/log.txt
# ✅ Result: permanent-data-2026 (Data survived complete container destruction!)
```
