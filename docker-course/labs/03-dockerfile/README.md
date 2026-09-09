# 🧪 Lab 03: Dockerfile Directives & Build Cache Invalidation

## 🎯 Objectives
1. Write a custom Dockerfile utilizing `ARG`, `ENV`, `WORKDIR`, `COPY`, and `CMD`.
2. Observe how Docker caches build layers and learn how to avoid cache-busting mistakes.

---

## 🔬 Step 1: Starter Application
Create a simple directory structure:
```text
labs/03-dockerfile/
├── Dockerfile
└── app.sh
```

`app.sh`:
```sh
#!/bin/sh
echo "Application running version: $APP_VERSION in environment: $ENVIRONMENT"
```

`Dockerfile`:
```dockerfile
FROM alpine:3.19
ARG VERSION=1.0.0
ENV APP_VERSION=${VERSION} \
    ENVIRONMENT=production

WORKDIR /app
COPY app.sh .
RUN chmod +x app.sh

CMD ["/app/app.sh"]
```

## 🔬 Step 2: Build with Arguments & Run
```bash
# Build image with default ARG
docker build -t app-versioned:1.0 .

# Build image with overridden ARG
docker build --build-arg VERSION=2.5.0 -t app-versioned:2.5 .

# Run both images to observe output
docker run --rm app-versioned:1.0
docker run --rm app-versioned:2.5
```
