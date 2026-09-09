# 10 — Replication, Leaders & In-Sync Replicas (ISR)

## 1. Why Replication Matters

Hardware fails: hard drives crash, network cables get disconnected, cloud VMs get preempted.
Kafka replicates each partition log across multiple broker nodes to guarantee **high availability and zero data loss**.

```mermaid
flowchart TB
    subgraph Partition 0 (Replication Factor = 3)
        Leader["Broker 1: LEADER (Active Read/Write)"]
        Follower1["Broker 2: FOLLOWER (In-Sync Replica)"]
        Follower2["Broker 3: FOLLOWER (In-Sync Replica)"]
    end

    Producer -->|Writes to Leader| Leader
    Leader -.->|Replicates via TCP| Follower1
    Leader -.->|Replicates via TCP| Follower2
```

---

## 2. Key Terms Defined

- **Replication Factor (RF)**: Total number of copies of a partition across distinct brokers (Production standard = `3`).
- **Partition Leader**: The single broker responsible for all client reads and writes for that partition.
- **Partition Follower**: Brokers that fetch messages from the leader and replicate the log locally.
- **In-Sync Replicas (ISR)**: The set of followers actively caught up with the leader within `replica.lag.time.max.ms` (e.g. 30 seconds).

---

## 3. High Availability Formula

For maximum durability and zero message loss in production:

$$\text{Replication Factor} = 3, \quad \text{min.insync.replicas} = 2, \quad \text{acks} = \text{all} (-1)$$

Under this configuration:
1. Producer sends message to Leader.
2. Leader waits until at least 1 Follower copies the record ($1 \text{ leader} + 1 \text{ follower} = 2 \text{ ISR}$).
3. If 1 broker crashes, the cluster continues writing and reading without interruption or data loss!

---

## 4. Next Steps
Go to [11-delivery-semantics.md](file:///c:/Users/Sulaiman/Desktop/pratice-dev/docs/11-delivery-semantics.md) to understand At-Most-Once, At-Least-Once, and Exactly-Once semantics.
