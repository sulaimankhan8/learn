# 🔄 Deep Dive: Local Development Workflow & Hot Reloading

## 1. The Challenge of Containerized Development
In production, your code is baked immutably into the image. But during development:
- You need changes in `src/` to trigger instant hot-reloading (`nodemon` or `vite`).
- You must **not** rebuild the Docker image after every single line of code edited.
- You must isolate Linux container `node_modules` from host OS binaries.

---

## 2. The Compose Dev vs Prod Architecture

```text
       DEVELOPMENT OVERRIDE                              PRODUCTION COMPOSE
 ┌──────────────────────────────┐                  ┌──────────────────────────────┐
 │ • compose.dev.yaml           │                  │ • compose.prod.yaml          │
 │ • Bind Mount (Host -> /app)  │                  │ • Baked immutable image      │
 │ • CMD: ["npm", "run", "dev"] │                  │ • CMD: ["node", "server.js"] │
 │ • Exposed ports for debugging│                  │ • Zero dev dependencies      │
 └──────────────────────────────┘                  └──────────────────────────────┘
```

---

## 3. Development Compose File: `compose.dev.yaml`

```yaml
# compose.dev.yaml
services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    command: npm run dev
    ports:
      - "3000:3000"
      - "9229:9229" # Node.js Inspector / Chrome DevTools debug port
    environment:
      - NODE_ENV=development
      - PORT=3000
      - MONGO_URI=mongodb://mongo:27017/dev_db
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/usr/src/app         # Live code synchronization
      - /usr/src/app/node_modules     # Anonymous volume protecting container deps
    depends_on:
      - mongo
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    command: npm run dev -- --host
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/usr/src/app
      - /usr/src/app/node_modules
```

### Starting the Development Environment:
```bash
docker compose -f compose.dev.yaml up --build
```
