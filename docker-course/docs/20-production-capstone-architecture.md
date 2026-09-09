# 🏛️ Production Capstone System Architecture

```text
                                  INTERNET / USERS
                                         │
                                         ▼ (Port 80 / 443)
                 ┌───────────────────────────────────────────────┐
                 │          NGINX EDGE REVERSE PROXY             │
                 │         (Rate limiting, Caching, SSL)         │
                 └───────────────┬───────────────┬───────────────┘
                                 │               │
                     Path: /api/*│               │ Path: /*
                                 ▼               ▼
                 ┌───────────────────┐   ┌───────────────────┐
                 │  NODE / EXPRESS   │   │  REACT FRONTEND   │
                 │  API CLUSTER      │   │  (Static Nginx)   │
                 │  (3 Replicas)     │   └───────────────────┘
                 └─────────┬─────────┘             │
                           │                       │
         ┌─────────────────┴─────────────────┐     │
         │                                   │     │ [edge-net]
         ▼                                   ▼     │
  ┌─────────────┐                     ┌─────────────┐
  │   MONGODB   │                     │    REDIS    │
  │ (Data Vol)  │                     │ (Cache Vol) │
  └─────────────┘                     └─────────────┘
  [ internal-net: Air-gapped, zero external host port publishing ]
```

---

## Architecture Guarantees
1. **Network Segregation**: The database (`mongo`) and cache (`redis`) live exclusively on `internal-net` and do **not** publish any ports to the host OS. Only the backend API can communicate with them.
2. **Resilience & Healthchecks**: Every container includes active health checks with automatic restart policies (`unless-stopped`).
3. **Immutability & Least Privilege**: Backend and Frontend containers run as non-root users (`USER node` / `nginx`), have read-only root filesystems, and drop all unnecessary Linux capabilities.
4. **Data Durability**: Mongo and Redis state is stored on Docker named volumes, ensuring zero data loss during stack updates or node restarts.
