# 🔐 Deep Dive: Environment Variables & Secrets Management

## 1. Secrets Hierarchy & Anti-Patterns

```text
 ┌─────────────────────────────────────────────────────────────┐
 │ ❌ LEVEL 0 (FATAL): Hardcoded in Dockerfile (ENV KEY=123)    │ <── Baked into public image layer forever
 ├─────────────────────────────────────────────────────────────┤
 │ ❌ LEVEL 1 (DANGEROUS): Committed in Git repo (.env)        │ <── Exposed via version control history
 ├─────────────────────────────────────────────────────────────┤
 │ ⚠️ LEVEL 2 (ACCEPTABLE FOR DEV): .env file + .dockerignore   │ <── Ignored from git, mounted via Compose
 ├─────────────────────────────────────────────────────────────┤
 │ ✅ LEVEL 3 (PRODUCTION): Docker Secrets / AWS Secrets Mgr   │ <── Injected at runtime in-memory via /run/secrets
 └─────────────────────────────────────────────────────────────┘
```

---

## 2. Ingestion Methods Compared

### A. CLI Flag (`-e` and `--env-file`)
```bash
# Single key inline
docker run -e NODE_ENV=production -e PORT=3000 my-app

# Bulk from local ignored .env file
docker run --env-file .env.production my-app
```

### B. Docker Compose `.env` Substitution
```yaml
services:
  api:
    image: my-node-api:1.0.0
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://${DB_USER}:${DB_PASS}@mongo:27017/prod_db
      - REDIS_HOST=redis
```

---

## 3. Docker Secrets (Production Standard)

Docker secrets mount encrypted tokens as in-memory files at `/run/secrets/<secret_name>` (tmpfs):

```yaml
services:
  backend:
    image: my-backend:1.0.0
    secrets:
      - db_password
      - stripe_api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  stripe_api_key:
    external: true
```

In Node.js, read secrets safely from the filesystem:
```javascript
const fs = require('fs');

function getSecret(secretName, fallbackEnv) {
  const secretPath = `/run/secrets/${secretName}`;
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf8').trim();
  }
  return process.env[fallbackEnv];
}

const dbPassword = getSecret('db_password', 'DB_PASSWORD');
```
