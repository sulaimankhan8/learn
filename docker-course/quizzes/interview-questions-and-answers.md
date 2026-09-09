# 🎯 Senior DevOps & Docker Interview Mastery

---

### Q1 (Beginner): What is the fundamental difference between a Docker Container and a Virtual Machine?
**Answer**:
A Virtual Machine virtualizes the underlying physical hardware using a Hypervisor. Each VM boots a complete, independent Guest Operating System with its own full kernel, resulting in gigabytes of storage and long boot times.
A Docker container virtualizes the Operating System by leveraging Linux Kernel primitives (**Namespaces** for process, network, and filesystem isolation, and **cgroups** for resource constraints). Containers share the host OS kernel and run as lightweight isolated processes.

---

### Q2 (Intermediate): How does Docker layer caching work, and why does the ordering of `COPY` and `RUN` instructions matter?
**Answer**:
Docker builds images in sequential layers. When building, Docker checks if a cached layer exists for each instruction. If an instruction's input has changed (e.g. `COPY . .` when source files modified), that layer and **all subsequent layers** invalidate their cache and must re-execute. Placing frequently changing files (`COPY . .`) before slow installation steps (`RUN npm install`) forces dependencies to reinstall on every build. Placing `COPY package*.json ./` followed by `RUN npm ci` ensures dependencies are cached unless `package.json` changes.

---

### Q3 (Intermediate): What is the PID 1 problem in Docker containers, and how do you resolve it?
**Answer**:
In Linux, PID 1 has special responsibilities: reaping zombie processes and handling system signals. By default, the Linux kernel does not apply default signal actions (like terminating on `SIGTERM`) to PID 1 unless the process explicitly registers a handler. If a Node.js process is spawned via shell form (`CMD node server.js`), `/bin/sh` runs as PID 1 and will not forward `SIGTERM` to Node. The container hangs until Docker forcefully sends `SIGKILL` (Exit code 137) after 10 seconds.
Resolution:
1. Use Exec form: `CMD ["node", "src/server.js"]`.
2. Use an init process like `tini` or `dumb-init` (`ENTRYPOINT ["/usr/bin/dumb-init", "--"]`).
3. Explicitly catch `process.on('SIGTERM')` in Node.js to gracefully close database pools and HTTP connections.

---

### Q4 (Advanced): Why should you avoid running containers on the default `bridge` network in production?
**Answer**:
1. The default bridge does **not** support automatic DNS resolution by container name (requires outdated `--link` or hardcoded IPs).
2. All unassigned containers share the default bridge, breaking isolation between unrelated application stacks.
3. User-defined custom bridge networks provide automatic service discovery (DNS), granular network security boundaries, and the ability to attach/detach networks dynamically.

---

### Q5 (Senior / Architectural): How would you design a secure, production-grade container architecture for a Node.js Express microservice connecting to MongoDB and Redis?
**Answer**:
1. **Multi-Stage Minimal Build**: Build in a heavy image, run in `node:20-alpine` with production-only dependencies (<140MB).
2. **Non-Root Execution**: Run as `USER node` (UID 1000) with `--chown=node:node` to prevent host privilege escalation.
3. **Network Boundary**: Attach the API to two networks: `edge-net` (shared with Nginx reverse proxy) and `internal-net` (shared with MongoDB and Redis). MongoDB and Redis do not publish host ports.
4. **Data Persistence**: Mount MongoDB `/data/db` and Redis `/data` to Docker Named Volumes.
5. **Runtime Hardening**: Apply `cap-drop: ALL`, enable read-only root filesystem with `tmpfs` mounts, and enforce memory/CPU limits (`deploy.resources.limits.memory: 512M`).
6. **Graceful Degradation**: Implement HTTP `/health` endpoints and configure Compose `depends_on: condition: service_healthy` to eliminate startup race conditions.
