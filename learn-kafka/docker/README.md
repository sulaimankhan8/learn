# Docker Infrastructure Guide

This environment provides a pre-configured local development cluster using Apache Kafka in KRaft mode (no ZooKeeper needed!), Kafka UI for visualization, PostgreSQL for database integration and transactional outbox patterns, and Redis.

---

## 🚀 Services Overview

| Service | Container Name | Host Port | Internal Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Apache Kafka** | `kafka-node-broker` | `9092` | `29092` | Message Broker (KRaft mode) |
| **Kafka UI** | `kafka-node-ui` | `8080` | `8080` | Web UI for viewing topics, partitions, messages, consumers |
| **PostgreSQL** | `kafka-node-postgres` | `5432` | `5432` | Database for persistence & outbox patterns |
| **Redis** | `kafka-node-redis` | `6379` | `6379` | Cache & fast state store |

---

## 🛠️ Commands

### 1. Start all services in the background
```bash
npm run docker:up
# Or directly:
docker compose -f docker/docker-compose.yml up -d
```

### 2. Check cluster readiness
```bash
npm run wait:kafka
```

### 3. Open Kafka UI
Open your browser to: **[http://localhost:8080](http://localhost:8080)**

### 4. View service logs
```bash
npm run docker:logs
```

### 5. Stop all services
```bash
npm run docker:down
```

### 6. Reset database volume & Kafka state
```bash
docker compose -f docker/docker-compose.yml down -v
```

---

## 🔍 Verifying with Kafka CLI inside Docker

You can run native Kafka CLI scripts inside the container without installing Kafka on your host machine:

### List topics
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### Create a 3-partition topic
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic test-topic --partitions 3 --replication-factor 1
```

### Describe a topic
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic test-topic
```

### Produce messages from CLI
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic test-topic
```

### Consume messages from CLI
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-topic --from-beginning
```
