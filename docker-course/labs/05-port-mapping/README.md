# 🧪 Lab 05: Port Mapping & Host Interface Bindings

## 🎯 Objectives
Understand the difference between `HOST_PORT:CONTAINER_PORT`, binding to specific host interfaces (`127.0.0.1:8080:80`), dynamic port allocation (`-P`), and internal container listening addresses.

---

## 🔬 Hands-on Experiments

### 1. Standard Port Publishing
```bash
# Maps host 8080 to container 80
docker run -d -p 8080:80 --name web-1 nginx:alpine
curl http://localhost:8080
```

### 2. Restricting Exposure to Localhost (Security Best Practice)
By default, `-p 8080:80` binds to `0.0.0.0:8080` (accessible from any device on your local Wi-Fi / network). To restrict it solely to the local host machine:
```bash
docker run -d -p 127.0.0.1:8081:80 --name web-secure nginx:alpine
```

### 3. Dynamic Port Allocation (`-P`)
```bash
# Docker assigns random ephemeral host port to EXPOSE'd ports
docker run -d -P --name web-dynamic nginx:alpine
docker port web-dynamic
```
