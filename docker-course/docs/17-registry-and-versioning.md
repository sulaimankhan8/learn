# 🏷️ Deep Dive: Registries, Tagging Strategies & Versioning

## 1. The Pitfalls of the `latest` Tag

> **Rule of Thumb**: `latest` simply points to the most recent untagged build. It is not an actual version!
- Deploying `latest` means two servers deployed 5 minutes apart might run two completely different versions of your app.
- Rolling back is impossible if you overwrite `latest`.

---

## 2. Production Tagging Strategy

Apply **Triple-Tagging** in your automated CI/CD pipeline:

```bash
# 1. Semantic Version (for humans and release tracking)
docker tag my-app:local my-registry.com/org/my-app:1.4.2

# 2. Git Commit SHA (for 100% immutable traceability)
docker tag my-app:local my-registry.com/org/my-app:sha-a8f3b9c

# 3. Environment/Branch Tag (for staging environments)
docker tag my-app:local my-registry.com/org/my-app:staging
```

---

## 3. Working with Docker Registries (Docker Hub & GHCR)

```bash
# Authenticate
docker login ghcr.io -u <username> -p <token>

# Tag with registry prefix
docker tag my-node-api:1.0.0 ghcr.io/my-org/my-node-api:1.0.0

# Push image layers
docker push ghcr.io/my-org/my-node-api:1.0.0

# Pull on production host
docker pull ghcr.io/my-org/my-node-api:1.0.0
```
