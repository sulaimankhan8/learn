# 🧪 Lab 10: Docker Compose Multi-Service Architecture

## 🎯 Objectives
1. Define a 3-tier architecture (Express API + Mongo + Redis) in `compose.yaml`.
2. Configure active healthchecks and service dependency conditions.

---

## 🔬 Starter `compose.yaml`

```yaml
name: lab-stack

services:
  api:
    image: node:20-alpine
    working_dir: /app
    command: sh -c "echo 'API Running' && sleep 3600"
    ports:
      - "3000:3000"
    depends_on:
      mongo:
        condition: service_healthy
      redis:
        condition: service_healthy

  mongo:
    image: mongo:7.0
    volumes:
      - mongo-vol:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  mongo-vol:
```

## 🔬 Execution
```bash
docker compose up -d
docker compose ps
docker compose logs -f
docker compose down
```
