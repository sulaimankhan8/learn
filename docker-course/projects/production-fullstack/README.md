# 🚀 Production Full-Stack Microservice Capstone

A complete, production-grade microservice architecture containerized with Docker and orchestrated with Docker Compose.

```text
                       [ CLIENT / BROWSER ]
                                 │
                                 ▼ (Port 80)
                       [ NGINX REVERSE PROXY ]
                                /     \
                               /       \
                        /api/ v         v /*
                   [ NODE API ]    [ REACT SPA ]
                      /    \
                     /      \
                    v        v
              [ MONGODB ]  [ REDIS ]
```

---

## 🛠️ Tech Stack & Key Features
- **Frontend**: React 18 + Vite, Multi-stage built and served via minimal Nginx Alpine (<25MB).
- **Backend API**: Node.js 20 Express, non-root user (`node`), graceful shutdown handler, active healthcheck endpoint.
- **Database**: MongoDB 7.0 with persistent named volume storage.
- **Cache**: Redis 7.2 with Append-Only File (AOF) persistence.
- **Edge Ingress**: Nginx reverse proxy with load balancing, caching, and upstream routing.
- **Security**: Zero exposed internal ports, non-root execution, `cap-drop: ALL`.

---

## 🚀 Running the Stack

### Local Development (with hot-reloading)
```bash
docker compose -f compose.dev.yaml up --build
```

### Production Mode
```bash
docker compose -f compose.prod.yaml up -d --build
```

### Verification
```bash
# Verify health
curl http://localhost/api/health

# Add item to MongoDB & Redis cache
curl -X POST http://localhost/api/items -H "Content-Type: application/json" -d '{"name": "Dockerized Laptop", "price": 1299}'

# Fetch items (cached via Redis)
curl http://localhost/api/items
```
