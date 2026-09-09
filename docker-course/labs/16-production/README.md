# 🧪 Lab 16: Golden Image Production Audit

## 🎯 Objectives
Audit a Dockerfile against the 20-point production readiness checklist and apply fixes.

---

## 🔬 Audit Checklist Execution
1. Base image pinned to exact patch digest (`node:20.11.1-alpine3.19`).
2. Multi-stage build eliminating build artifacts.
3. Unprivileged user execution (`USER node`).
4. `HEALTHCHECK` directive implemented with exponential backoff / retries.
5. Resource limits defined in `compose.prod.yaml`.
