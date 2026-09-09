# 🧪 Lab 08: Persistent MongoDB Containerization

## 🎯 Objectives
1. Run a containerized MongoDB instance with persistent storage and authentication.
2. Connect from Node.js using Mongoose over a custom Docker bridge network.

---

## 🔬 Hands-on Instructions

```bash
# 1. Create network & volume
docker network create db-network
docker volume create mongo-data

# 2. Run Mongo container
docker run -d \
  --name mongodb-srv \
  --net db-network \
  -v mongo-data:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=secretpassword \
  mongo:7.0

# 3. Test with mongosh client inside container
docker exec -it mongodb-srv mongosh -u admin -p secretpassword --eval "db.stats()"
```
