# 🧪 Lab 02: Docker CLI Command Laboratory

## 🎯 Objectives
Master the critical Docker CLI commands used daily in DevOps:
1. Inspect running containers and extract specific nested JSON properties.
2. Monitor real-time container resource utilization (`docker stats`).
3. Copy files dynamically between host and container (`docker cp`).
4. Reclaim system disk space safely with `docker system prune`.

---

## 🔬 Hands-on Lab Tasks

### 1. Advanced Formatting with Go Templates
Run an Nginx container and extract only its IP address and state:
```bash
docker run -d --name web-target -p 8080:80 nginx:alpine

# Extract IP address directly:
docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web-target

# Extract exact start time:
docker inspect --format='{{.State.StartedAt}}' web-target
```

### 2. Live File Transfer (`docker cp`)
```bash
# Create local file on host
echo "<h1>Custom Docker Page</h1>" > index.html

# Copy into running container
docker cp index.html web-target:/usr/share/nginx/html/index.html

# Verify change
curl http://localhost:8080
```

### 3. Cleanup & Prune
```bash
docker stop web-target
docker rm web-target
docker system df
```
