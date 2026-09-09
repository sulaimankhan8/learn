# ⚖️ Deep Dive: Resource Management, CPU, Memory & OOM Killer

## 1. Why Unconstrained Containers are Dangerous

By default, a Docker container has no resource limits and can consume as much memory and CPU cycles as the host OS kernel will allow. If a Node.js process experiences a memory leak, it can starve the host OS, causing system freeze or kernel panic.

---

## 2. Memory Limits & The Linux OOM Killer

When a container exceeds its memory ceiling, the Linux kernel's **Out-Of-Memory (OOM) Killer** terminates the process with exit code **137** (`128 + 9 (SIGKILL)`).

```bash
# Run with hard 256MB memory limit
docker run -d --memory="256m" --memory-swap="256m" --name memory-capped my-app
```

In Docker Compose:
```yaml
services:
  api:
    image: my-node-api:1.0.0
    deploy:
      resources:
        limits:
          cpus: '0.50'     # Max 50% of 1 CPU core
          memory: 512M     # Hard memory limit (Triggers OOMKilled if exceeded)
        reservations:
          cpus: '0.25'     # Guaranteed baseline CPU
          memory: 256M     # Guaranteed baseline RAM
```

---

## 3. Real-Time Resource Monitoring

```bash
# Live stream of CPU %, MEM USAGE / LIMIT, MEM %, NET I/O, BLOCK I/O, PIDS
docker stats

# Inspect specific container's OOM status
docker inspect --format='OOMKilled: {{.State.OOMKilled}}, ExitCode: {{.State.ExitCode}}' my-container
```
