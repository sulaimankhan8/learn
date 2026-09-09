# 📋 Production Readiness: The 20-Point Golden Checklist

Before deploying any Docker container or stack into a production environment, verify all 20 criteria:

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       PRODUCTION DOCKER CHECKLIST                           │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ [ ] 01. Minimal Base Image: Alpine or Slim used (<150MB target).            │
 │ [ ] 02. Pinned Versions: Exact version tags (e.g. node:20.11.1-alpine3.19). │
 │ [ ] 03. Multi-Stage Builds: Build dependencies discarded from final image.  │
 │ [ ] 04. Non-Root Execution: Container runs as unprivileged USER (UID 1000). │
 │ [ ] 05. File Ownership: Files copied with explicit --chown=user:group.      │
 │ [ ] 06. .dockerignore Configured: Excludes node_modules, git, and secrets.  │
 │ [ ] 07. PID 1 Signal Handling: Uses dumb-init/tini & Node handles SIGTERM.  │
 │ [ ] 08. Exec Form in CMD: Uses ["node", "server.js"] instead of shell form. │
 │ [ ] 09. Structured Healthchecks: Real HTTP healthcheck probes defined.      │
 │ [ ] 10. Explicit Resource Limits: Memory limits and CPU quotas enforced.    │
 │ [ ] 11. No Baked Secrets: Zero API keys/passwords baked into image layers.  │
 │ [ ] 12. Read-Only Root Filesystem: Container filesystem mounted as read-only│
 │ [ ] 13. Logging to STDOUT/STDERR: JSON-formatted structured logging enabled.│
 │ [ ] 14. Custom Bridge Networks: Never run on default Docker bridge.         │
 │ [ ] 15. Database Persistence: Named volumes attached to database storage.   │
 │ [ ] 16. Restart Policies Configured: restart: unless-stopped or always.     │
 │ [ ] 17. Vulnerability Scans: Scanned with Trivy or Docker Scout in CI.      │
 │ [ ] 18. SemVer Tagging: Tagged with vX.Y.Z and git commit SHA (never latest)│
 │ [ ] 19. Graceful Shutdown Timeout: DB connection draining within 10 seconds.│
 │ [ ] 20. Port Binding: Node binds to 0.0.0.0, internal services not exposed. │
 └─────────────────────────────────────────────────────────────────────────────┘
```
