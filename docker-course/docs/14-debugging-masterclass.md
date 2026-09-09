# 🕵️ Masterclass: 12 Real-World Docker Debugging Scenarios

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       DOCKER INCIDENT TRIAGE FLOWCHART                      │
 │                                                                             │
 │                   Container not behaving as expected                        │
 │                                   │                                         │
 │                                   ▼                                         │
 │                            Is it running?                                   │
 │                           /              \                                  │
 │                         NO                YES                               │
 │                         /                    \                              │
 │            Check 'docker ps -a'        Can you reach its port?              │
 │            Check Exit Code:                   /          \                  │
 │            • 137 -> OOM Killer / Killed     NO            YES               │
 │            • 127 -> Command not found      /                \               │
 │            • 1   -> App threw exception  Check port map   Check DB / Network│
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12 Classic Production Failure Modes & Solutions

### Scenario 1: Container Immediately Exits with Code 0
- **Cause**: PID 1 command ran to completion (e.g. `CMD ["echo", "done"]` or `CMD ["service", "nginx", "start"]` which forks to background).
- **Fix**: The main process MUST run in the foreground (e.g. `CMD ["nginx", "-g", "daemon off;"]`).

### Scenario 2: Container Exits with Code 137
- **Cause**: Linux OOM Killer terminated the process because it exceeded `--memory` limit, or host issued ungraceful `SIGKILL`.
- **Fix**: Run `docker inspect --format='{{.State.OOMKilled}}' <id>`. If true, increase memory ceiling or fix memory leak in Node.js app.

### Scenario 3: Port is Not Accessible on Host (`localhost:3000` fails)
- **Cause**: App is bound to `127.0.0.1` inside the container, which only accepts traffic from inside the container's own loopback namespace!
- **Fix**: Bind Express/Node server to `0.0.0.0` (all interfaces): `app.listen(3000, '0.0.0.0')`.

### Scenario 4: Node API Cannot Connect to MongoDB (`ECONNREFUSED mongodb://localhost:27017`)
- **Cause**: Inside a container, `localhost` refers to the container itself, NOT your host machine or other containers.
- **Fix**: Connect containers via a custom Docker network and use the service name: `mongodb://mongo:27017/mydb`.

### Scenario 5: Missing Environment Variable / Secret at Runtime
- **Cause**: Variable was declared via `ARG` during build instead of `ENV` or Compose `environment`.
- **Fix**: Inspect runtime environment with `docker exec <id> env`.

### Scenario 6: Permission Denied (`EACCES: permission denied, open '/app/data'`)
- **Cause**: Container runs as non-root (`USER node`), but directory on host or image was created by `root`.
- **Fix**: Add `--chown=node:node` to `COPY` instructions and ensure bind-mounted directories have matching ownership.

### Scenario 7: Volume Data Disappears After Container Recreation
- **Cause**: Anonymous volume or missing volume declaration; or path mounted didn't match the database's actual data directory (`/data/db` for Mongo).
- **Fix**: Verify with `docker inspect <id> --format='{{json .Mounts}}'`.

### Scenario 8: Internal DNS Resolution Failure (`getaddrinfo ENOTFOUND`)
- **Cause**: Containers are running on the default `bridge` network instead of a user-defined network.
- **Fix**: Attach both containers to the same custom bridge network.

### Scenario 9: Image Build Fails on Alpine Native Module Compilation
- **Cause**: Node packages requiring C++ compilation (`bcrypt`, `sharp`) need `python3`, `make`, `g++` which are absent in Alpine.
- **Fix**: Add `RUN apk add --no-cache python3 make g++` in the builder stage, or switch to `node:20-slim`.

### Scenario 10: Docker Ignore Leakage (Bloated Images / Exposed Secrets)
- **Cause**: Missing or malformed `.dockerignore` file. Local `node_modules` copied into Linux container.
- **Fix**: Verify `.dockerignore` excludes `node_modules`, `.git`, `.env*`.

### Scenario 11: Healthcheck Stuck in `(unhealthy)` State
- **Cause**: Healthcheck command uses `curl` in an Alpine image where only `wget` is installed, or endpoint returns non-200.
- **Fix**: Inspect healthcheck failure logs via `docker inspect --format='{{json .State.Health}}' <id>`.

### Scenario 12: Application Works with `docker run` but Fails in `docker compose`
- **Cause**: Race condition where API starts before Database is fully initialized and accepting sockets.
- **Fix**: Use `depends_on` with `condition: service_healthy`.
