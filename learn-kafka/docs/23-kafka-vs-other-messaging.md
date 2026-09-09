# 23 — Kafka vs. Other Messaging Systems

## 1. Architectural Comparison Matrix

| Feature | Apache Kafka | RabbitMQ | AWS SQS | Redis Pub/Sub |
| :--- | :--- | :--- | :--- | :--- |
| **Model** | Distributed Commit Log | Message Broker / Smart Queue | Managed Smart Queue | In-Memory Ephemeral Pub/Sub |
| **Persistence** | Immutable log on disk (retained for days/years) | Transient; removed when acknowledged | Transient; removed when deleted | Ephemeral in RAM (unless Redis Streams) |
| **Replayability** | ✅ Unlimited (rewind offset) | ❌ No | ❌ No | ❌ No |
| **Consumer Scaling** | Partition-based consumer groups | Competing consumers on single queue | Competing consumers | Broadcast to all active subscribers |
| **Throughput** | 🚀 Millions msg/sec | ~50k–100k msg/sec | Scalable (HTTP batch limits) | 🚀 Hundreds of thousands (RAM-bound) |
| **Ordering** | ✅ Strict per partition key | ⚠️ FIFO queues with low concurrency | ⚠️ FIFO queues with throughput caps | ❌ Best-effort |
| **Complex Routing** | ❌ Topics & Partitions only | ✅ Rich exchange routing (Topic, Fanout, Direct, Headers) | ❌ Simple Queue / SNS routing | ⚠️ Simple pattern matching |

---

## 2. When to Choose Kafka

- You need **high throughput event streaming** (millions of events/sec).
- Multiple independent systems need to **consume and replay the same event stream**.
- You need **strict sequential ordering per entity** (e.g. per user, per vehicle, per sensor).
- You are building **event-driven microservices** or **Change Data Capture (CDC)** architectures.

---

## 3. When NOT to Choose Kafka

- You need a simple job queue with **per-message delay timers** (e.g. "send email in 15 minutes") $\rightarrow$ Use **RabbitMQ** or **BullMQ/Redis**.
- You need **complex routing topologies** across dozens of routing keys without topic overhead $\rightarrow$ Use **RabbitMQ**.
- You only need simple ephemeral push notifications with zero durability $\rightarrow$ Use **Redis Pub/Sub** or **WebSockets**.
