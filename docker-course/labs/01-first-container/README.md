# 🧪 Lab 01: Your First Container & Isolation Diagnostics

## 🎯 Objectives
In this lab, you will:
1. Pull and execute your first container.
2. Inspect how Linux namespaces isolate a container's filesystem and process tree.
3. Compare foreground vs detached execution modes.
4. Diagnose container lifecycle states and inspect raw container metadata.
5. Complete Challenge 01 independently.

---

## 🔬 Step 1: Verify Your Docker Environment

Check that your Docker daemon is running and reachable:

```bash
docker version
docker info
```

> **What is happening?**
> The Docker CLI client connects to the Docker Daemon socket. If the daemon is offline, the client will fail with a connection error.

---

## 🔬 Step 2: The Simplest Container Run

Execute the following command:

```bash
docker run alpine echo "Hello from inside the container"
```

### What Docker did behind the scenes:
1. Checked local image cache for `alpine:latest`.
2. Not finding it locally, reached out to **Docker Hub Registry** to pull the image layers.
3. Created a new container instance (allocated PID, NET, MNT namespaces).
4. Mounted a fresh Read/Write overlay layer.
5. Executed `echo "Hello from inside the container"` as PID 1 inside the container.
6. Streamed STDOUT to your terminal.
7. As soon as the `echo` process exited, the container shifted from `running` to `exited (0)`.

Check it:
```bash
docker ps
docker ps -a
```
Notice that `docker ps` is empty, but `docker ps -a` shows your exited container!

---

## 🔬 Step 3: Interactive Exploration & Namespace Proof

Now let's step inside an isolated Linux environment:

```bash
docker run -it --rm --name exploration-box alpine sh
```

You are now inside an isolated Alpine Linux shell (`/ #`). Run these commands inside the container:

```sh
# Check process isolation (Notice how few processes exist, and 'sh' is PID 1)
ps aux

# Check filesystem isolation
ls -la /

# Check hostname isolation
hostname

# Create a temporary file
echo "isolation-proof" > /test.txt
ls -la /test.txt

# Exit the container
exit
```

Because we passed `--rm`, the container and its writeable layer are automatically destroyed upon exiting.

---

## 🔬 Step 4: Detached Mode vs Foreground

Run a background web server container:

```bash
docker run -d -p 8080:80 --name test-nginx nginx:alpine
```

### Verify:
1. Check running status:
   ```bash
   docker ps
   ```
2. Inspect the port mapping:
   ```bash
   docker port test-nginx
   ```
3. Test reachability from your host:
   ```bash
   curl http://localhost:8080
   ```
4. Stream logs:
   ```bash
   docker logs test-nginx
   ```
5. Clean up:
   ```bash
   docker stop test-nginx
   docker rm test-nginx
   ```

---

## 💥 Lab Challenge: Challenge 01

Navigate to [challenge/instructions.md](file:///c:/Users/Sulaiman/Desktop/pratice-dev/docker-course/labs/01-first-container/challenge/instructions.md) to attempt your first practical challenge!
