# 🌐 Deep Dive: Docker Networking, DNS & Service Discovery

## 1. The 4 Native Network Drivers

```text
┌─────────────────┬────────────────────────────────────────────────────────────────────────┐
│ Driver          │ Behavior & Use Case                                                    │
├─────────────────┼────────────────────────────────────────────────────────────────────────┤
│ bridge (Default)│ Virtual private network on host. Containers get 172.x.x.x IPs.         │
│ host            │ Removes network isolation. Container shares host's network stack & IPs.│
│ none            │ Container has no network interface except loopback (air-gapped).       │
│ overlay         │ Multi-host mesh networking (used in Docker Swarm & K8s overlay CNI).   │
└─────────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Default Bridge vs User-Defined Custom Bridge

> ⚠️ **CRITICAL PRODUCTION RULE**: Never run production multi-container apps on the `default bridge` network. Always create custom bridge networks!

| Feature | Default Bridge (`bridge`) | User-Defined Custom Bridge |
|---|---|---|
| **Automatic DNS Resolution** | ❌ **Disabled** (Must use manual `--link` or raw IP) | ✅ **Enabled** (Resolve by container name: `mongodb://mongo:27017`) |
| **Network Isolation** | ❌ All containers attach to same default bridge | ✅ Complete isolation between separate application stacks |
| **Dynamic Attachment** | ❌ Must recreate container to change network | ✅ Attach/detach running containers live (`docker network connect`) |

```text
                     CUSTOM BRIDGE ARCHITECTURE (app-net)
                                       
                     Host Machine (e.g. 192.168.1.50)
                                      │
                                 :8080│ Port Forwarding
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │ Node API (172.20.0.2)                            │
             │ Container Port :3000                             │
             └───────────────┬──────────────────┬───────────────┘
                             │                  │
               DNS: "mongo"  │                  │  DNS: "redis"
              (172.20.0.3)   ▼                  ▼ (172.20.0.4)
                    ┌─────────────────┐   ┌─────────────────┐
                    │  MongoDB        │   │  Redis          │
                    │  Port: 27017    │   │  Port: 6379     │
                    └─────────────────┘   └─────────────────┘
                    [ Unexposed to Host ] [ Unexposed to Host ]
```

---

## 3. How Docker DNS Works (`127.0.0.11`)

Every container on a custom bridge has an embedded DNS resolver at IP `127.0.0.11`.
1. When your Express backend calls `mongoose.connect('mongodb://mongo:27017')`, Node asks `/etc/resolv.conf` -> queries `127.0.0.11`.
2. Docker Engine's internal DNS matches `"mongo"` to the IP address allocated to that container on the shared bridge (`172.20.0.3`).
3. External hostnames (e.g. `api.stripe.com`) are forwarded by `127.0.0.11` to the host's upstream DNS nameservers (e.g. `8.8.8.8`).

---

## 4. Port Forwarding: `-p` vs `EXPOSE`

- **`EXPOSE 3000` (in Dockerfile)**: Pure metadata/documentation. It does **not** open ports or make them accessible on the host machine.
- **`-p 8080:3000` (CLI flag)**: Instructs Docker to configure Linux `iptables` / Windows NAT rules to forward incoming traffic on Host port `8080` to Container port `3000`.
- **Inter-container traffic**: Containers on the same custom network talk directly using container ports (`3000`, `27017`, `6379`) without needing `-p` published on the host!
