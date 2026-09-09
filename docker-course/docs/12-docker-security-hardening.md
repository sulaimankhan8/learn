# 🛡️ Deep Dive: Production Docker Security Hardening

## 1. Top 7 Container Security Principles

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ 1. NEVER RUN AS ROOT                                                        │
 │    Switch to unprivileged UID (e.g. USER node or UID 10001)                 │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 2. USE READ-ONLY ROOT FILESYSTEMS                                           │
 │    docker run --read-only --tmpfs /tmp                                      │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 3. DROP UNNECESSARY LINUX CAPABILITIES                                      │
 │    docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE                     │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 4. NEVER MOUNT /var/run/docker.sock UNLESS STRICTLY NECESSARY               │
 │    Mounting the Docker socket gives the container full root control over host│
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 5. ENFORCE RESOURCE CONSTRAINTS (CPU & MEMORY)                              │
 │    Prevents single buggy container from triggering Host Kernel panic        │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 6. PIN EXACT IMAGE DIGESTS / TAGS                                           │
 │    Never deploy ':latest'. Pin to sha256 digests in mission-critical tiers  │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 7. SCAN IMAGES FOR VULNERABILITIES IN CI                                    │
 │    docker scout cves / trivy image my-image:1.0.0                           │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Linux Capabilities (`cap-drop` & `cap-add`)

By default, Docker grants a container a subset of Linux root capabilities (`CAP_CHOWN`, `CAP_KILL`, `CAP_SETUID`). A hardened container drops everything:

```yaml
services:
  api:
    image: my-secure-api:1.0.0
    user: "10001:10001"
    read_only: true
    tmpfs:
      - /tmp
      - /var/tmp
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # Only needed if binding to ports < 1024
    security_opt:
      - no-new-privileges:true
```

---

## 3. Vulnerability Scanning with Docker Scout & Trivy

```bash
# Scan local image with Docker Scout
docker scout quickview my-app:1.0.0
docker scout cves my-app:1.0.0

# Scan with Trivy CLI
trivy image --severity HIGH,CRITICAL my-app:1.0.0
```
