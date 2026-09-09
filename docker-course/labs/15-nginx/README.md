# 🧪 Lab 15: Nginx Reverse Proxy & Static File Ingress

## 🎯 Objectives
1. Configure Nginx to route `/api/*` to an Express container and `/*` to static React files.
2. Verify reverse proxy headers (`X-Real-IP`, `X-Forwarded-For`).

---

## 🔬 Files Setup

`nginx.conf`:
```nginx
events {}
http {
  server {
    listen 80;
    
    location /api/ {
      proxy_pass http://api:3000/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }
  }
}
```

```bash
docker compose up -d
curl http://localhost/api/health
```
