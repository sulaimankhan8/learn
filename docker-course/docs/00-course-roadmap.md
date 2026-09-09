# 🗺️ Docker Mastery Curriculum Roadmap

This curriculum takes you systematically from low-level Linux isolation primitives to designing resilient, hardened, multi-container production topologies.

```text
                               THE DOCKER JOURNEY
                               
    [Level 00-01]               [Level 02-05]               [Level 06-08]
 Foundation & CLI            Images & Dockerfiles        Networks & Storage
 ┌────────────────┐          ┌────────────────┐          ┌────────────────┐
 │ • Linux Kernel │          │ • UnionFS      │          │ • Custom Bridge│
 │ • Namespaces   │  ─────>  │ • Multi-Stage  │  ─────>  │ • DNS Discovery│
 │ • Docker Engine│          │ • PID 1 Signals│          │ • Named Volumes│
 │ • Lifecycle    │          │ • Node.js v1-v6│          │ • Bind Mounts  │
 └────────────────┘          └────────────────┘          └────────────────┘
                                                                 │
                                                                 ▼
    [Level 14-16]               [Level 11-13]               [Level 09-10]
 Debugging & Nginx           Hardening & Limits           Docker Compose
 ┌────────────────┐          ┌────────────────┐          ┌────────────────┐
 │ • 12 Break-Fix │          │ • Non-Root     │          │ • Multi-Service│
 │ • Nginx Proxy  │  <─────  │ • Capabilities │  <─────  │ • Dev Workflow │
 │ • Upstream Load│          │ • Memory / OOM │          │ • Hot-Reloading│
 │ • Multi-Tier   │          │ • CPU Shares   │          │ • compose.dev  │
 └────────────────┘          └────────────────┘          └────────────────┘
         │
         ▼
    [Level 17-19]               [Level 20-21]
 Production & CI/CD          Cloud & Capstone
 ┌────────────────┐          ┌────────────────┐
 │ • Golden Image │          │ • Cloud Models │
 │ • SemVer Tags  │  ─────>  │ • React + Node │
 │ • GitHub Action│          │ • Mongo + Redis│
 │ • Vulnerability│          │ • Final Project│
 └────────────────┘          └────────────────┘
```

---

## 📚 Module Breakdown

### Module 1: Core Mechanics & CLI Mastery (Levels 0–1)
- What Docker is vs Virtual Machines (Hypervisors vs OS-level virtualization).
- Namespaces (PID, NET, MNT, IPC, UTS, USER) & cgroups (resource limits).
- Docker Client-Server architecture (REST API over unix socket / named pipe).
- Comprehensive CLI commands lab: inspection, execution, metrics, logs, pruning.

### Module 2: Image Architecture & Custom Dockerfiles (Levels 2–5)
- Union Filesystem (Overlay2), immutable read-only image layers, copy-on-write (CoW) container layer.
- Layer caching mechanics and build optimization.
- Anatomy of Dockerfile instructions: `FROM`, `WORKDIR`, `COPY` vs `ADD`, `RUN`, `CMD` vs `ENTRYPOINT`, `ENV` vs `ARG`.
- Node.js Application containerization evolution (from bloated naive image to optimized non-root image).
- Container process tree, PID 1 responsibility, signal trapping (`SIGTERM`, `SIGKILL`), and graceful shutdown.

### Module 3: Networking, Volumes & Secrets (Levels 6–8)
- Docker Virtual Ethernet (`veth`) pairs, Linux bridges, `iptables` NAT port forwarding.
- Docker internal DNS resolver (`127.0.0.11`) and service discovery by container name.
- Persistent storage: Ephemeral layer vs Named Volumes vs Bind Mounts vs `tmpfs`.
- Managing environment variables and securely passing runtime configuration vs build arguments.

### Module 4: Orchestration, Development Workflow & Multi-Stage (Levels 9–11)
- Multi-container architecture with Docker Compose.
- Development vs Production compose configurations (bind mounts, hot-reloading with nodemon/vite, dependency isolation).
- Multi-stage builds: Compiling build artifacts in heavy SDK environments and copying only runtime artifacts to slim minimal images (Alpine, Distroless).

### Module 5: Security, Resource Constraints & Diagnostics (Levels 12–14)
- Container security: Principle of least privilege, running as non-root (`USER node`), dropping Linux capabilities (`CAP_DROP`), read-only root filesystems.
- Resource limits: Enforcing memory caps, CPU quotas, handling `OOMKilled` (Exit code 137).
- Senior Debugging Laboratory: 12 real-world failure scenarios (crashes, DNS timeouts, socket hangs, volume permission errors).

### Module 6: Edge Routing, Production Readiness & CI/CD (Levels 15–19)
- Nginx reverse proxy configuration for fronting React SPAs and Express APIs.
- Production checklist: pinned base digests, healthchecks, structured logging, zero downtime restarts.
- Image tagging strategies (SemVer vs git SHA vs `latest` anti-pattern).
- Automated CI/CD with GitHub Actions: build caching, Trivy vulnerability scanning, automated registry push.

### Module 7: Cloud Ecosystem & Final Capstone Project (Levels 20–21)
- Transitioning containers to Cloud architectures (ECS / Fargate, Google Cloud Run, Kubernetes pods).
- Capstone Project: Architecting, containerizing, networking, persisting, securing, and deploying a complete Full-Stack Microservice (React, Node/Express, MongoDB, Redis, Nginx).
