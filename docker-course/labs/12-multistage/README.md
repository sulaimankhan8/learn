# 🧪 Lab 12: Multi-Stage Image Optimization Laboratory

## 🎯 Objectives
1. Compare single-stage vs multi-stage image sizes for a React SPA build.
2. Shrink a >1GB builder image down to <25MB runtime Nginx image.

---

## 🔬 Multi-Stage `Dockerfile`

```dockerfile
# STAGE 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# STAGE 2: Minimal Web Server
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t react-app:optimized .
docker images react-app:optimized
```
