# Kafka CLI Reference Manual

Run all commands directly inside your Docker container:
`docker exec -it kafka-node-broker /opt/kafka/bin/<command>`

---

## 📋 1. Topic Management (`kafka-topics.sh`)

### List all topics
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list
```

### Create a topic with 3 partitions
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic commerce.orders.v1 \
  --partitions 3 --replication-factor 1
```

### Describe topic partitions and metadata
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe --topic commerce.orders.v1
```

### Increase partition count (e.g. to 6 partitions)
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --alter --topic commerce.orders.v1 --partitions 6
```

### Delete a topic
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --delete --topic commerce.orders.v1
```

---

## 👥 2. Consumer Group Management (`kafka-consumer-groups.sh`)

### List all active consumer groups
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --list
```

### Describe a consumer group & check Consumer Lag
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group order-scaling-group
```

### Reset consumer group offset to earliest (Rewind time)
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group order-scaling-group \
  --reset-offsets --to-earliest --execute \
  --topic commerce.orders.v1
```

---

## 💬 3. Console Producer & Consumer

### Produce interactively from terminal (with keys)
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic commerce.orders.v1 \
  --property "parse.key=true" \
  --property "key.separator=:"
# Type: user_1:{"orderId":"1001","amount":50}
```

### Consume from beginning with keys and timestamps
```bash
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic commerce.orders.v1 \
  --from-beginning \
  --property print.key=true \
  --property print.timestamp=true
```
