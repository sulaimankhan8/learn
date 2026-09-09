# 🧪 Lab 04: Containerizing a Node.js Express REST API

## 🎯 Objectives
1. Containerize an Express server connecting to Redis.
2. Implement non-root user execution (`USER node`).
3. Add healthcheck endpoints and configure `.dockerignore`.

---

## 🔬 Step 1: Starter Application Code

`package.json`:
```json
{
  "name": "node-docker-app",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  }
}
```

`src/server.js`:
```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Dockerized Node.js API!', nodeVersion: process.version });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
```

`Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node src/ ./src/

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
```

## 🔬 Step 2: Build & Verify
```bash
docker build -t my-node-api:1.0 .
docker run -d -p 3000:3000 --name node-app my-node-api:1.0
curl http://localhost:3000
curl http://localhost:3000/health
```
