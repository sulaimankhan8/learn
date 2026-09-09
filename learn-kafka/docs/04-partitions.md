# 04 — Partitions & Partitioning Strategies

## 1. Why Do Partitions Exist?

A single machine has hard physical limits on disk throughput, network bandwidth, and memory. If a topic had only one partition, its write throughput would be capped at the speed of that single broker.

**Partitions solve two problems:**
1. **Horizontal Scalability (Storage & Throughput)**: A topic with 12 partitions can be spread across 12 different broker disks.
2. **Parallel Consumption**: Each partition in a topic can be consumed by at most one consumer instance inside the same consumer group at any given time.

```mermaid
flowchart LR
    subgraph Topic: payments (3 Partitions)
        P0[Partition 0 on Broker 1]
        P1[Partition 1 on Broker 2]
        P2[Partition 2 on Broker 3]
    end

    Producer -->|Hash Key 'user_1'| P0
    Producer -->|Hash Key 'user_2'| P1
    Producer -->|Hash Key 'user_3'| P2
```

---

## 2. Partition Ordering Rules

> [!IMPORTANT]
> **Kafka ONLY guarantees ordering WITHIN a single partition.**
> There is **no global ordering guarantee** across different partitions of the same topic.

```text
Partition 0: [Msg A (offset 0)] -> [Msg B (offset 1)] -> [Msg C (offset 2)]  (Guaranteed order A -> B -> C)
Partition 1: [Msg X (offset 0)] -> [Msg Y (offset 1)]                        (Guaranteed order X -> Y)
```
If Consumer reads both P0 and P1, it might process `Msg X`, then `Msg A`, then `Msg Y`, then `Msg B`.

---

## 3. How Kafka Assigns Messages to Partitions

When a producer sends a message:
1. **With a Message Key**: Kafka computes a 32-bit Murmur2 hash of the key:
   $$\text{partition} = \text{murmur2}(\text{key}) \pmod{\text{numPartitions}}$$
   All messages with the exact same key will **always land in the same partition**, guaranteeing strict per-entity ordering (e.g. all events for `order_100` are strictly ordered).
2. **Without a Message Key (`null` key)**: Kafka uses a sticky partitioning or round-robin strategy to distribute batches evenly across partitions.

---

## 4. Scaling Considerations: Can You Reduce Partitions?

- **Increasing Partitions**: You can increase the number of partitions on a live topic (e.g. from 3 to 6).
- **Decreasing Partitions**: **IMPOSSIBLE in Kafka without recreating the topic.** Decreasing partitions would violate existing key-hash mappings and truncate historical data.
- **Key Hashing Impact**: When you increase the partition count, existing keys will hash to different partition indices. If ordering of past events matters, plan partition counts upfront!

---

## 5. Next Steps
Go to [05-producers.md](file:///c:/Users/Sulaiman/Desktop/pratice-dev/docs/05-producers.md) to build robust Node.js producers.
