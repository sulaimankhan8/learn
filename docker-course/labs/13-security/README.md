# 🧪 Lab 13: Container Security & Privilege Demotion

## 🎯 Objectives
1. Convert an insecure root container to a non-root unprivileged container.
2. Drop Linux capabilities (`cap-drop=ALL`) and test read-only filesystem restrictions.

---

## 🔬 Hardened Compose Definition

```yaml
services:
  secure-service:
    image: node:20-alpine
    user: "1000:1000" # Run as node user
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    command: sh -c "id && touch /tmp/allowed.txt && touch /forbidden.txt || echo 'Read-only root filesystem enforced!'"
```

```bash
docker compose run --rm secure-service
```
