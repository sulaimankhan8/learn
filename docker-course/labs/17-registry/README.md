# 🧪 Lab 17: Image Tagging & Registry Workflows

## 🎯 Objectives
1. Tag Docker images with SemVer and Git Commit SHAs.
2. Push and pull images from Docker Hub or GitHub Container Registry (GHCR).

---

## 🔬 Hands-on CLI Workflow
```bash
# Build
docker build -t my-app:local .

# Triple-Tagging Strategy
docker tag my-app:local myuser/my-app:1.0.0
docker tag my-app:local myuser/my-app:sha-8f921ab
docker tag my-app:local myuser/my-app:latest

# Push
docker push myuser/my-app:1.0.0
docker push myuser/my-app:sha-8f921ab
```
