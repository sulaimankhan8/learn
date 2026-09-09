# 🏗️ Deep Dive: Docker Architecture & OS-Level Virtualization

## 1. What Docker Actually Is

Docker is **not** a Virtual Machine. Docker is a platform that uses features built directly into the **Linux Kernel** to isolate processes from each other and from the host system.

When you run a container, you are running a standard process on your host operating system's kernel, wrapped in isolated namespaces and constrained by control groups.

```text
┌─────────────────────────────────────────┐  ┌─────────────────────────────────────────┐
│           VIRTUAL MACHINES              │  │               CONTAINERS                │
├─────────────────────────────────────────┤  ├─────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐       │  │ ┌──────────────┐ ┌──────────────┐       │
│ │   App A      │ │   App B      │       │  │ │   App A      │ │   App B      │       │
│ ├──────────────┤ ├──────────────┤       │  │ ├──────────────┤ ├──────────────┤       │
│ │  Bins / Libs │ │  Bins / Libs │       │  │ │  Bins / Libs │ │  Bins / Libs │       │
│ ├──────────────┤ ├──────────────┤       │  │ └──────────────┘ └──────────────┘       │
│ │   Guest OS   │ │   Guest OS   │       │  │ Isolated Namespaces + cgroups limits    │
│ │(Full Kernel) │ │(Full Kernel) │       │  │ ┌─────────────────────────────────────┐ │
│ └──────────────┘ └──────────────┘       │  │ │       Docker Engine / containerd    │ │
│ ┌─────────────────────────────────────┐ │  │ ├─────────────────────────────────────┤ │
│ │        Hypervisor (Type 1/2)        │ │  │ │          Host Linux Kernel          │ │
│ ├─────────────────────────────────────┤ │  │ ├─────────────────────────────────────┤ │
│ │          Host Infrastructure        │ │  │ │         Host Infrastructure         │ │
│ └─────────────────────────────────────┘ │  │ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘  └─────────────────────────────────────────┘
  • Heavyweight (Gigabytes per VM)             • Lightweight (Megabytes per container)
  • Minutes to boot (Full OS initialization)   • Milliseconds to boot (Just process launch)
  • Virtualizes Hardware                       • Virtualizes Operating System
```

---

## 2. The Linux Kernel Isolation Pillars

Docker relies on two primary primitives in the Linux kernel:

### A. Linux Namespaces (What a process can SEE)
Namespaces provide process-level isolation by giving a container its own virtualized view of system resources:

| Namespace | Isolates | What the container sees |
|---|---|---|
| **PID** (Process ID) | Process Tree | Container process sees itself as `PID 1`, completely unaware of other host processes. |
| **NET** (Networking) | Network stack | Container gets its own virtual network interfaces (`eth0`), loopback (`lo`), routing tables, and port range. |
| **MNT** (Mount) | Filesystem | Container sees its own isolated root filesystem (`/`), unable to touch the host root filesystem unless explicitly mounted. |
| **UTS** (Unix Timesharing)| Hostname | Container has its own isolated hostname and domain name. |
| **IPC** (Inter-Process) | Shared Memory | Container cannot access host shared memory segments, semaphores, or message queues. |
| **USER** (User IDs) | User mapping | Allows a user inside a container (e.g. `root` UID 0) to be mapped to an unprivileged user (UID 10001) on the host. |

### B. Control Groups / cgroups (What a process can USE)
Control Groups enforce resource metering and constraints:
- **Memory Limits**: Restricts RAM usage (e.g. max 512MB). If exceeded, the kernel OOM-killer terminates the container.
- **CPU Limits**: Restricts CPU quota/shares (e.g. container gets max 50% of 1 CPU core).
- **Block I/O**: Throttles read/write rates to disk.
- **Process Limits (`pids.max`)**: Prevents "fork bombs" by capping maximum processes in the container.

---

## 3. The Docker Engine Architecture

Docker is a **Client-Server** application. The `docker` command you type in your terminal is merely a client that makes REST API calls to the Docker Daemon (`dockerd`).

```text
                                DOCKER SYSTEM ARCHITECTURE
                                
   [ DOCKER CLIENT ]                                    [ DOCKER DAEMON (dockerd) ]
┌───────────────────────┐                             ┌──────────────────────────────────────┐
│  docker run ...       │                             │  Engine REST API                     │
│  docker build ...     │  ──── REST API (gRPC) ───>  │  (Unix Socket: /var/run/docker.sock) │
│  docker ps            │    over Named Pipe or Unix  │                                      │
└───────────────────────┘                             └──────────────────┬───────────────────┘
                                                                         │
                                                                         ▼
                                                      ┌──────────────────────────────────────┐
                                                      │  containerd (Container Lifecycle)    │
                                                      └──────────────────┬───────────────────┘
                                                                         │
                                                                         ▼
                                                      ┌──────────────────────────────────────┐
                                                      │  runc (OCI Runtime - talks to Kernel)│
                                                      └──────────────────┬───────────────────┘
                                                                         │
                                                                         ▼
                                                      ┌──────────────────────────────────────┐
                                                      │  Host Linux Kernel                   │
                                                      │  (Namespaces, cgroups, OverlayFS)    │
                                                      └──────────────────────────────────────┘
```

1. **Docker CLI (`docker`)**: Command-line interface that accepts your instructions, translates them into HTTP REST requests, and sends them to the daemon.
2. **Docker Daemon (`dockerd`)**: Background daemon managing images, containers, networks, and storage volumes.
3. **containerd**: Industry-standard core container runtime managing image transfer, execution, and supervision.
4. **runc**: Low-level Open Container Initiative (OCI) tool that directly interacts with the Linux kernel to configure namespaces and cgroups, then execs the process.

---

## 4. Images vs Containers

| Feature | Docker Image | Docker Container |
|---|---|---|
| **Analogy** | Blueprint / Class | Running Instance / Object |
| **State** | Immutable (Read-Only) | Dynamic (Read-Write top layer) |
| **Storage** | Stacked Read-Only Layers (UnionFS) | Ephemeral Read-Write layer stacked on top of Image |
| **Execution**| Stored on disk / registry | Active process consuming memory & CPU |

```text
 ┌───────────────────────────────────────────────────────────┐
 │               RUNNING CONTAINER INSTANCE                  │
 │                                                           │
 │  ┌─────────────────────────────────────────────────────┐  │
 │  │ Container Layer (Read / Write) - Ephemeral Memory    │  │ <── Changes, logs, temp files written here
 │  ├─────────────────────────────────────────────────────┤  │
 │  │ Image Layer 3 (Read-Only) - e.g. COPY app code      │  │
 │  ├─────────────────────────────────────────────────────┤  │
 │  │ Image Layer 2 (Read-Only) - e.g. RUN npm install    │  │ <── Docker Image (Immutable)
 │  ├─────────────────────────────────────────────────────┤  │
 │  │ Image Layer 1 (Read-Only) - Base OS (Alpine / Node) │  │
 │  └─────────────────────────────────────────────────────┘  │
 └───────────────────────────────────────────────────────────┘
```
