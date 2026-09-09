# Advanced Exercises & Production Scenarios

## 📝 1. Advanced Architecture & Reliability Quiz

1. **What is the Dual-Write Problem, and how does the Transactional Outbox pattern solve it?**
   - A) Writing to both Kafka and Redis simultaneously.
   - B) If an application saves to a relational database and publishes to Kafka in two separate steps, one can fail while the other succeeds, causing inconsistency. The Transactional Outbox pattern writes both business data and an event record into the same database within a single atomic ACID transaction. An asynchronous relay then flushes outbox records to Kafka.

2. **In a 3-broker cluster with `replication.factor=3`, `min.insync.replicas=2`, and `acks=all`, how many broker failures can the cluster tolerate before writes start failing?**
   - A) 2 broker failures
   - B) 1 broker failure (because at least 2 ISR replicas must be alive to satisfy `min.insync.replicas=2`)
   - C) 0 broker failures

3. **Why is `unclean.leader.election.enable=false` recommended in production?**
   - A) It prevents an out-of-sync follower (which is missing uncommitted records) from ever being elected as partition leader, preventing silent data loss.
   - B) It prevents ZooKeeper from crashing.

---

## 🐛 2. Production Debugging Challenge: Rebalance Storm

> **Symptom:** In production, a Node.js consumer group repeatedly triggers rebalances every 35 seconds. Message processing halts and throughput drops to 0.
> **Code:**
> ```javascript
> const consumer = kafka.consumer({
>   groupId: 'heavy-computation-group',
>   sessionTimeout: 30000 // 30s
> });
> 
> consumer.run({
>   eachMessage: async ({ message }) => {
>     // Heavy CPU image processing / synchronous PDF generation taking 45 seconds!
>     await processHeavyImage(message.value);
>   }
> });
> ```

<details>
<summary>🔍 Reveal Solution</summary>

**Problem:** The image processing takes 45s, which exceeds `sessionTimeout: 30000ms`. The Node.js single-threaded event loop is blocked, background heartbeats fail to send, and the Group Coordinator assumes the worker died, kicking it out and triggering an endless rebalance storm!

**Fixes:**
1. Offload heavy CPU work to Node.js Worker Threads (`worker_threads`) or a separate job queue.
2. Periodically invoke `await heartbeat()` during execution.
3. Increase `sessionTimeout` to accommodate long operations.
</details>

---

## 💼 3. Senior / Staff Kafka Interview Questions

1. *How does Kafka's zero-copy architecture (`sendfile` system call) achieve near-physical network line-speed?*
2. *Describe the exact protocol steps involved in a Kafka 2-phase commit transaction (`transactional.id`).*
3. *How do you perform a zero-downtime schema evolution when replacing a required field with a new format in an active event stream?*
