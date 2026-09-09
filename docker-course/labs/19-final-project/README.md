# 🧪 Lab 19: Capstone Production Microservices Architecture

## 🎯 Objectives
Build, network, persist, secure, and deploy the complete Full-Stack Microservice System located in [projects/production-fullstack/](file:///c:/Users/Sulaiman/Desktop/pratice-dev/docker-course/projects/production-fullstack/).

---

## 🔬 System Components
- **Edge Reverse Proxy**: Nginx (routing `/api` and `/`, SSL/Gzip ready)
- **Frontend**: React SPA served via multi-stage static Alpine container
- **Backend API**: Node.js Express cluster (non-root, graceful shutdown, healthchecked)
- **State Layer**: MongoDB 7.0 (Named persistent volume) + Redis 7.2 (AOF caching)

---

## 🔬 Quickstart
```bash
cd projects/production-fullstack

# Start full production stack
docker compose -f compose.prod.yaml up -d --build

# Verify all services healthy
docker compose -f compose.prod.yaml ps

# Test endpoints through Nginx edge
curl http://localhost/api/health
curl http://localhost/api/items
```
