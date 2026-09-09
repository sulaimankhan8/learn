# Kafka + Node.js Quick Reference Cheat Sheet

## 🛠️ CLI Quick Commands

```bash
# Check Kafka Readiness
npm run wait:kafka

# List topics
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

# Describe consumer group & lag
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group <group-id>

# Reset consumer group offset to beginning
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group <group-id> --reset-offsets --to-earliest --execute --topic <topic-name>
```

---

## 💻 KafkaJS Quick Snippets

### Minimal Producer
```javascript
import { Kafka } from 'kafkajs';
const kafka = new Kafka({ clientId: 'app', brokers: ['localhost:9092'] });
const producer = kafka.producer({ idempotent: true });

await producer.connect();
await producer.send({
  topic: 'orders.v1',
  messages: [{ key: 'order-1', value: JSON.stringify({ id: 1, amount: 99 }) }]
});
await producer.disconnect();
```

### Minimal Consumer with Manual Offset Commit
```javascript
import { Kafka } from 'kafkajs';
const kafka = new Kafka({ clientId: 'app', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'my-group' });

await consumer.connect();
await consumer.subscribe({ topic: 'orders.v1', fromBeginning: false });

await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message }) => {
    const payload = JSON.parse(message.value.toString());
    console.log('Received:', payload);

    await consumer.commitOffsets([
      { topic, partition, offset: (BigInt(message.offset) + 1n).toString() }
    ]);
  }
});
```

---

## ⚡ Production Rules of Thumb
- **Partitions:** Start with 3–12 partitions per topic. You can increase partitions later, but can *never* decrease them.
- **Keys:** Always set message keys for entities where sequential ordering is critical (e.g., `userId`, `orderId`).
- **Replication:** `ReplicationFactor = 3`, `min.insync.replicas = 2`, `acks = -1` (`all`).
- **Idempotency:** Always use `idempotent: true` on producers, and deduplication tables on consumers.
