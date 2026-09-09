# 🧪 Lab 11: Dynamic Environments & Secrets Separation

## 🎯 Objectives
1. Configure `.env` file variables with Compose variable interpolation.
2. Ensure secrets are never exposed in image build layers.

---

## 🔬 Files Setup

`.env`:
```env
APP_PORT=3000
DB_NAME=production_store
DB_PASS=super_secret_docker_password_2026
```

`compose.yaml`:
```yaml
services:
  app:
    image: alpine
    command: sh -c "echo 'DB: $DATABASE_URL' && sleep 3600"
    environment:
      - DATABASE_URL=mongodb://admin:${DB_PASS}@mongo:27017/${DB_NAME}
      - PORT=${APP_PORT}
```

```bash
docker compose up -d
docker compose exec app env
docker compose down
```
