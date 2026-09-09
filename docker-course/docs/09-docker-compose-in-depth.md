# 🎼 Deep Dive: Docker Compose Multi-Container Orchestration

## 1. What Docker Compose Solves

Instead of manually running 4 separate commands with long network and volume parameters:
```bash
docker network create my-net
docker volume create mongo-data
docker run -d --net my-net -v mongo-data:/data/db --name mongo mongo:7.0
docker run -d --net my-net --name redis redis:alpine
docker run -d --net my-net -p 3000:3000 -e MONGO_URI=... my-api
docker run -d --net my-net -p 80:80 my-frontend
```

Docker Compose defines the entire stack declaratively in a single file: `compose.yaml`.

---

## 2. Full-Stack Production Compose Blueprint

```yaml
# compose.yaml
name: e-commerce-system

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      api:
        condition: service_healthy
    networks:
      - edge-net

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGO_URI=mongodb://mongo:27017/shop_db
      - REDIS_URL=redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      mongo:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped
    networks:
      - edge-net
      - internal-net

  mongo:
    image: mongo:7.0-jammy
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    networks:
      - internal-net

  redis:
    image: redis:7.2-alpine
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: always
    networks:
      - internal-net

volumes:
  mongo-data:
    driver: local
  redis-data:
    driver: local

networks:
  edge-net:
    driver: bridge
  internal-net:
    driver: bridge
    internal: true  # Prevents direct internet connectivity to Mongo & Redis
```

---

## 3. Essential Compose Commands

```bash
# Start all services detached and build if needed
docker compose up -d --build

# View unified interleaved color-coded logs
docker compose logs -f api

# View container status and healthcheck states
docker compose ps

# Execute command inside a compose service
docker compose exec api sh

# Stop and remove containers and internal networks (keeps named volumes intact)
docker compose down

# Stop and wipe everything including named volumes
docker compose down -v
```
