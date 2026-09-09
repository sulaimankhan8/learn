# 🌐 Deep Dive: Nginx Reverse Proxy, Routing & Load Balancing

## 1. Why Place Nginx in Front of Microservices?

```text
                           CLIENT / BROWSER
                                  │
                                  ▼ (Port 80 / 443)
                      ┌───────────────────────┐
                      │     NGINX REVERSE     │
                      │     PROXY CONTAINER   │
                      └───────────┬───────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
     Path: /api/*│                     Path: /*    │ (Static SPA)
                 ▼                                 ▼
       ┌───────────────────┐             ┌───────────────────┐
       │ Node.js Express   │             │ React Production  │
       │ API (:3000)       │             │ Web Server (:80)  │
       └───────────────────┘             └───────────────────┘
```

**Benefits**:
- **Single Entrypoint**: No CORS issues (both frontend and backend share the same domain).
- **SSL Termination**: Single place to install and renew SSL certificates.
- **Static Asset Caching & Compression**: Gzip/Brotli compression handled natively in C at lightning speed.
- **Load Balancing**: Distributes incoming traffic across multiple Node API replicas.

---

## 2. Production Nginx Configuration (`nginx.conf`)

```nginx
events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Upstream Node API Cluster
    upstream backend_cluster {
        least_conn; # Load balancing algorithm: Least Connections
        server api:3000 max_fails=3 fail_timeout=10s;
    }

    # Upstream React Frontend
    upstream frontend_cluster {
        server frontend:80;
    }

    server {
        listen 80;
        server_name localhost;

        # Route API requests to Node Express Backend
        location /api/ {
            proxy_pass http://backend_cluster;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Route all other traffic to React Frontend
        location / {
            proxy_pass http://frontend_cluster;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```
