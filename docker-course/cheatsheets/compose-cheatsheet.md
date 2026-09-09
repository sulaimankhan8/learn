# 🎼 Docker Compose Cheatsheet

| Command | Action |
|---|---|
| `docker compose up -d` | Build, create, and start containers in background |
| `docker compose up -d --build` | Force rebuild of images before starting containers |
| `docker compose down` | Stop and remove containers and internal networks |
| `docker compose down -v` | Stop containers, remove networks AND delete named volumes |
| `docker compose ps` | List containers and their health status |
| `docker compose logs -f <service>` | Stream live logs for a specific service |
| `docker compose exec <service> <cmd>` | Execute a command inside a running service container |
| `docker compose restart <service>` | Restart a specific service |
| `docker compose config` | Validate and view the resolved Compose configuration |
| `docker compose top` | Display running processes across all services |
