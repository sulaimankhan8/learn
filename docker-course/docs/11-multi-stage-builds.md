# 🏗️ Deep Dive: Multi-Stage Builds (React & Node.js)

## 1. Why Multi-Stage Builds Are Essential

A single Dockerfile can contain multiple `FROM` instructions. Each `FROM` starts a new stage with a clean filesystem. You can selectively copy artifacts from earlier stages into the final stage:

```text
 ┌────────────────────────────────────────────────────────┐
 │ Stage 1: Build Environment (Node + npm + devDeps + TS) │  Size: ~1.2 GB
 │ -> Runs 'npm run build' -> generates /app/dist         │
 └───────────────────────────┬────────────────────────────┘
                             │
                  COPY --from=build /app/dist /usr/share/nginx/html
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ Stage 2: Production Runtime (Nginx Alpine)             │  Size: ~25 MB!
 │ -> Serves only static HTML/JS/CSS                      │
 └────────────────────────────────────────────────────────┘
```

---

## 2. Production React SPA Multi-Stage Dockerfile

```dockerfile
# ==========================================
# STAGE 1: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Lightweight Static Web Server
# ==========================================
FROM nginx:1.25-alpine AS runner

# Remove default boilerplate nginx HTML
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (for React router SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Production Node.js Backend Multi-Stage Dockerfile

```dockerfile
# ==========================================
# STAGE 1: Production Dependencies Cache
# ==========================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ==========================================
# STAGE 2: Application Runner
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production \
    PORT=3000

# Copy node_modules from deps stage
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src/ ./src/

USER node
EXPOSE 3000

CMD ["node", "src/server.js"]
```
