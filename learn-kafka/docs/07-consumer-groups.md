# 07 — Consumer Groups & Load Balancing

## 1. What is a Consumer Group?

A **Consumer Group** is a set of consumers that cooperate to read all partitions of a topic. Kafka dynamically partitions the workload among members of the group.

```mermaid
flowchart TB
    subgraph Topic [Topic: orders - 4 Partitions]
        P0[Partition 0]
        P1[Partition 1]
        P2[Partition 2]
        P3[Partition 3]
    end

    subgraph GroupA [Consumer Group: payment-service (2 Instances)]
        C1[Consumer 1 -> Reads P0, P1]
        C2[Consumer 2 -> Reads P2, P3]
    end

    subgraph GroupB [Consumer Group: analytics-service (4 Instances)]
        CA[Consumer A -> Reads P0]
        CB[Consumer B -> Reads P1]
        CC[Consumer C -> Reads P2]
        CD[Consumer D -> Reads P3]
    end

    P0 --> C1
    P1 --> C1
    P2 --> C2
    P3 --> C2

    P0 --> CA
    P1 --> CB
    P2 --> CC
    P3 --> CD
```

---

## 2. Partition Assignment Rules

> [!IMPORTANT]
> **Cardinality Rule:**
> A single partition can be consumed by **ONLY ONE** consumer within a given consumer group at any instant.
>
> If you have **4 Partitions** and **5 Consumers** in the same group, the **5th consumer will sit 100% idle**!

```text
3 Partitions + 1 Consumer  => Consumer reads P0, P1, P2
3 Partitions + 2 Consumers => Consumer 1 reads P0, P1 | Consumer 2 reads P2
3 Partitions + 3 Consumers => Consumer 1 (P0) | Consumer 2 (P1) | Consumer 3 (P2)
3 Partitions + 4 Consumers => Consumer 1 (P0) | Consumer 2 (P1) | Consumer 3 (P2) | Consumer 4 (IDLE ⚠️)
```

---

## 3. Consumer Rebalancing

When a consumer joins, crashes, or is shut down, Kafka triggers a **Rebalance**:
1. The **Group Coordinator Broker** notifies active members.
2. The Group Leader computes the new partition assignment (e.g. RoundRobin, Range, or CooperativeSticky).
3. Partitions are redistributed to the surviving consumers.

KafkaJS emits rebalance lifecycle events you can listen to:

```javascript
consumer.on(consumer.events.GROUP_JOIN, (event) => {
  console.log('Joined group! Assigned partitions:', event.payload.memberAssignment);
});

consumer.on(consumer.events.REBALANCING, () => {
  console.warn('⚠️ Group is rebalancing! Committing in-flight work...');
});
```

---

## 4. Next Steps
Go to [08-offsets.md](file:///c:/Users/Sulaiman/Desktop/pratice-dev/docs/08-offsets.md) to master offset management and commit strategies.
