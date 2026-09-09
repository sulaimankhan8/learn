# KafkaJS Configuration Reference Bible

## 1. Client Configuration (`new Kafka({ ... })`)

```javascript
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
  ssl: false, // Set to true or TLS options in production
  sasl: undefined, // Or SCRAM credentials
  connectionTimeout: 10000, // Socket timeout in ms
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 300,
    maxRetryTime: 30000,
    retries: 8,
    factor: 2
  }
});
```

---

## 2. Producer Configuration (`kafka.producer({ ... })`)

```javascript
const producer = kafka.producer({
  idempotent: true, // Prevents duplicates and out-of-order retries
  maxInFlightRequests: 1, // Safe concurrent in-flight requests per connection
  transactionalId: undefined, // String for Kafka Transactions
  allowAutoTopicCreation: false // Disallow runtime rogue topics
});
```

### Producer `send()` Options:
```javascript
await producer.send({
  topic: 'orders.v1',
  acks: -1, // -1 or 'all' waits for full ISR consensus
  timeout: 30000,
  compression: CompressionTypes.GZIP, // NONE, GZIP, SNAPPY, LZ4, ZSTD
  messages: [
    {
      key: 'user-100', // Buffer or string (used for Murmur2 hash partition routing)
      value: JSON.stringify({ orderId: 'ORD-1' }), // Buffer or string
      headers: { 'correlation-id': 'xyz-123' },
      timestamp: Date.now().toString()
    }
  ]
});
```

---

## 3. Consumer Configuration (`kafka.consumer({ ... })`)

```javascript
const consumer = kafka.consumer({
  groupId: 'my-worker-group',
  sessionTimeout: 30000, // Time before coordinator marks consumer dead
  rebalanceTimeout: 60000, // Max time allowed to complete in-flight batches during rebalance
  heartbeatInterval: 3000, // Interval between background heartbeats
  maxBytesPerPartition: 1048576, // 1MB per partition
  readUncommitted: false // If false, only read committed transactions (read_committed)
});
```

### Consumer `run()` Options:
```javascript
await consumer.run({
  autoCommit: false, // Recommended: manual offset control
  autoCommitInterval: 5000,
  eachMessage: async ({ topic, partition, message, heartbeat }) => {
    // Business logic...
    await heartbeat(); // Keep consumer alive during long tasks
    await consumer.commitOffsets([
      { topic, partition, offset: (BigInt(message.offset) + 1n).toString() }
    ]);
  }
});
```
