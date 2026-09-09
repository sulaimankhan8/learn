# 🧪 Lab 09: Redis Caching & Append-Only Persistence

## 🎯 Objectives
1. Run Redis with AOF (Append-Only File) persistence enabled.
2. Set and get cache keys from a Node.js client container.

---

## 🔬 Hands-on Instructions

```bash
# 1. Create storage volume
docker volume create redis-data

# 2. Run Redis with AOF persistence
docker run -d \
  --name redis-srv \
  --net db-network \
  -v redis-data:/data \
  redis:7.2-alpine \
  redis-server --appendonly yes --requirepass "redispass123"

# 3. Test with redis-cli
docker exec -it redis-srv redis-cli -a redispass123 ping
docker exec -it redis-srv redis-cli -a redispass123 set user:101 '{"name":"Alice","role":"admin"}'
docker exec -it redis-srv redis-cli -a redispass123 get user:101
```
