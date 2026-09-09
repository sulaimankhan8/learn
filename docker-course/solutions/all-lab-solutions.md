# 💡 Master Solutions & Diagnostic Debriefs (Labs 01 – 19)

---

## Lab 01 Solution: First Container & Isolation
### Task 1: The Disappearing Data
```bash
# 1. Launch detached container
docker run -d --name box-alpha alpine sh -c "sleep 3600"

# 2. Create secret file
docker exec -it box-alpha sh -c "echo 'docker-mastery-key-2026' > /secret.txt"

# 3. Stop and Start box-alpha
docker stop box-alpha
docker start box-alpha
docker exec -it box-alpha cat /secret.txt
# Result: /secret.txt STILL EXISTS!
# Why? The container's top Read-Write layer persists as long as the container is not removed (rm).

# 4. Remove box-alpha & Launch box-beta
docker rm -f box-alpha
docker run -d --name box-beta alpine sh -c "sleep 3600"
docker exec -it box-beta cat /secret.txt
# Result: cat: can't open '/secret.txt': No such file or directory
# Why? The base 'alpine' image is immutable. Deleting box-alpha destroyed its private RW layer. box-beta starts with a fresh empty RW layer.
```

### Task 2: The Crash Investigator
```bash
docker run -d --name mystery-box alpine ls /nonexistent-directory
```
1. **Why missing from `docker ps`?** `ls` finished executing in milliseconds, so the container shifted to `exited` state.
2. **Command to view**: `docker ps -a`
3. **Exit Code**: `2` (Linux standard exit code for "No such file or directory").
4. **Logs**: `ls: /nonexistent-directory: No such file or directory`
5. **What determines runtime?** A container only stays running for as long as its **PID 1 foreground process** remains alive. When PID 1 terminates, the container stops.

---

## Lab 02 Solution: Custom Dockerfile & Layer Cache Optimization
```dockerfile
# Optimal Dockerfile
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/ ./src/
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
```

---

## Lab 06 Solution: Custom Bridge DNS
```bash
# Create custom bridge
docker network create internal-bridge

# Run Mongo without exposing ports to host
docker run -d --name mongo --net internal-bridge -v mongo-vol:/data/db mongo:7.0

# Run Redis
docker run -d --name redis --net internal-bridge redis:alpine

# Run API connecting via container hostnames
docker run -d --name api --net internal-bridge -p 3000:3000 \
  -e MONGO_URI="mongodb://mongo:27017/shop" \
  -e REDIS_URL="redis://redis:6379" \
  my-node-api:1.0.0
```
