# ⚡ Docker CLI Mastery Reference

Every command dissected: Purpose, Syntax, Example, Flags, Common Pitfalls & Production Relevance.

---

### 1. `docker run`
- **Purpose**: Creates a writeable container layer over an image and starts it.
- **Syntax**: `docker run [OPTIONS] IMAGE [COMMAND] [ARG...]`
- **Example**: `docker run -d -p 8080:80 --name my-web nginx:alpine`
- **Crucial Flags**:
  - `-d` : Detached mode (runs container in background).
  - `-p host_port:container_port` : Port publishing (forwards host port to container).
  - `-v host_dir_or_vol:container_dir` : Mounts a storage volume or bind mount.
  - `-e KEY=VALUE` : Injects environment variable.
  - `--name <name>` : Assigns a memorable container name instead of random generated string.
  - `--rm` : Automatically deletes container upon exit (essential for one-off tasks).
  - `-it` : Combines `-i` (interactive STDIN) and `-t` (allocate pseudo-TTY).
- **Common Mistake**: Confusing `-p 8080:80` with `-p 80:8080`. The format is strictly `HOST:CONTAINER`.
- **Production Relevance**: Orchestrators (K8s, Nomad) invoke these lifecycle steps under the hood; in development, `run` is your daily primary tool.

---

### 2. `docker ps` / `docker ps -a`
- **Purpose**: Lists active containers (`ps`) or all historical containers including stopped/exited ones (`ps -a`).
- **Syntax**: `docker ps [OPTIONS]`
- **Example**: `docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"`
- **Crucial Flags**:
  - `-a` : Include stopped containers.
  - `-q` : Only show numeric container IDs (great for scripting).
  - `--filter "status=exited"` : Filter output.
- **Common Mistake**: Assuming a container vanished when it crashed. It is actually still present in `docker ps -a`.
- **Production Relevance**: Quick triage of crashing containers (`Exited (137)` indicates Out Of Memory termination).

---

### 3. `docker logs`
- **Purpose**: Fetches the STDOUT and STDERR output streams of a container.
- **Syntax**: `docker logs [OPTIONS] CONTAINER`
- **Example**: `docker logs -f --tail 100 my-node-app`
- **Crucial Flags**:
  - `-f` : Follow / stream live logs in real time.
  - `--tail N` : Show only the last N lines.
  - `--timestamps` or `-t` : Prepend log lines with ISO timestamps.
- **Common Mistake**: Logging directly to files inside the container instead of STDOUT/STDERR. Docker log drivers only capture STDOUT/STDERR!
- **Production Relevance**: Standardized log collectors (Datadog, Fluentbit, AWS CloudWatch) scrape STDOUT streams from containers.

---

### 4. `docker exec`
- **Purpose**: Runs a new process inside an already active running container.
- **Syntax**: `docker exec [OPTIONS] CONTAINER COMMAND [ARG...]`
- **Example**: `docker exec -it my-mongo mongosh` or `docker exec -it my-node-app sh`
- **Crucial Flags**:
  - `-it` : Allows opening an interactive shell.
  - `-u <user>` : Execute command as a specific user (e.g., `-u 0` for root).
- **Common Mistake**: Trying to use `docker exec` on a stopped container (it must be in running state).
- **Production Relevance**: Live debugging, inspecting live network reachability (`curl`, `ping`), or running manual database migrations.

---

### 5. `docker inspect`
- **Purpose**: Returns low-level detailed JSON information about Docker objects (containers, images, volumes, networks).
- **Syntax**: `docker inspect CONTAINER_OR_IMAGE`
- **Example**: `docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' my-web`
- **Production Relevance**: Diagnosing exact IP assignments, mount states, healthcheck logs, and exit codes.

---

### 6. `docker system prune`
- **Purpose**: Reclaims disk space by removing unused containers, networks, dangling images, and build cache.
- **Syntax**: `docker system prune [OPTIONS]`
- **Example**: `docker system prune -a --volumes`
- **Crucial Flags**:
  - `-a` : Removes all unused images, not just dangling ones.
  - `--volumes` : Prunes anonymous unused volumes (WARNING: destroys unattached data!).
- **Production Relevance**: Automated cron tasks on CI build agents to prevent disk saturation.
