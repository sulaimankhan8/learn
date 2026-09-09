# 🚀 Node.js Containerization: Evolution from Naive to Production-Grade

Let's see how a real Node.js Express + MongoDB + Redis backend Dockerfile evolves through 6 distinct stages.

---

### ❌ Version 1: The Naive Beginner Dockerfile
```dockerfile
FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
CMD npm start
```
**Fatal Flaws**:
- `node:latest` is non-deterministic (breaks when upstream updates) and huge (>1.1GB).
- `COPY . .` before `npm install` busts the build cache on any single character change.
- `CMD npm start` spawns `npm` as PID 1 instead of `node`, preventing `SIGTERM` signals from reaching Node.
- Runs as `root` user (severe container escape vulnerability).
- Contains devDependencies, test files, and local `.env` keys.

---

### ⚠️ Version 2: Pinned Slim Base Image
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "src/server.js"]
```
**Improvements**:
- Pinned Node major version and reduced base footprint to ~200MB.
- Uses JSON exec array syntax `["node", "src/server.js"]` for proper PID 1 signal forwarding.

---

### ⚠️ Version 3: Layer Cache Optimization
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "src/server.js"]
```
**Improvements**:
- `package*.json` copied separately: `npm ci` only runs when dependencies change.
- `--omit=dev` prevents installing dev tools (Jest, ESLint, nodemon) into image.

---

### ⚠️ Version 4: Non-Root Security Hardening
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
```
**Improvements**:
- Drops `root` privileges. Switches to built-in unprivileged `node` user (UID 1000).
- Sets file ownership via `--chown=node:node`.

---

### ⚠️ Version 5: Multi-Stage Build (Zero Compiler Bloat)
```dockerfile
# Stage 1: Build & Prune
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Run TypeScript compilation or frontend build if applicable
# RUN npm run build

# Stage 2: Minimal Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/src ./src
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
```
**Improvements**:
- Isolates build tooling into discardable builder stage.
- Runtime stage has no compilers, cache, or unnecessary files. Image size shrinks to <140MB.

---

### ✅ Version 6: Production-Hardened Golden Dockerfile
```dockerfile
# Stage 1: Dependencies resolver
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Stage 2: Final hardened runner
FROM node:20-alpine AS runner
LABEL maintainer="engineering@example.com"
LABEL version="1.0.0"

# Install dumb-init or tini for proper PID 1 signal forwarding
RUN apk add --no-cache dumb-init

WORKDIR /usr/src/app
ENV NODE_ENV=production \
    PORT=3000

# Copy only production dependencies from deps stage
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src/ ./src/

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]
```
