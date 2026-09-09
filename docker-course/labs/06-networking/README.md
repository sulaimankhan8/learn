# 🧪 Lab 06: User-Defined Bridge Networks & DNS Resolution

## 🎯 Objectives
1. Prove why the default Docker bridge cannot resolve container names.
2. Create a user-defined custom bridge network.
3. Establish communication between Node.js, Redis, and MongoDB using container DNS names.

---

## 🔬 Hands-on Lab Steps

### 1. The Default Bridge Limitation
```bash
docker run -d --name c1 alpine sleep 3600
docker run -d --name c2 alpine sleep 3600

# Try pinging c1 from c2 by name:
docker exec c2 ping -c 2 c1
# ❌ Result: ping: bad address 'c1' (Default bridge lacks embedded DNS)
```

### 2. Creating a Custom Bridge Network
```bash
docker network create internal-net

# Run Redis attached to custom bridge
docker run -d --name cache-store --net internal-net redis:alpine

# Run an Alpine client on the same network
docker run --rm --net internal-net redis:alpine redis-cli -h cache-store ping
# ✅ Result: PONG (DNS automatically resolved 'cache-store' to its container IP!)
```

### 3. Cleanup
```bash
docker rm -f c1 c2 cache-store
docker network rm internal-net
```
