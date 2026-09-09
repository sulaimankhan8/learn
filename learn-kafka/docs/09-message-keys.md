# 09 — Message Keys & Ordering Guarantees

## 1. The Per-Entity Ordering Problem

In microservices, state mutations must happen in strict sequential order:
1. `ORDER_CREATED` ($t_0$)
2. `PAYMENT_CAPTURED` ($t_1$)
3. `ORDER_CANCELLED` ($t_2$)

If `ORDER_CANCELLED` is processed before `PAYMENT_CAPTURED`, the customer might be billed after cancellation!

---

## 2. Key-Based Partition Routing

By supplying an entity ID (e.g., `userId` or `orderId`) as the Kafka **message key**, Kafka applies Murmur2 hashing to consistently route every event for that entity to the **exact same partition**.

```mermaid
flowchart LR
    E1["Event 1: key='user_42' (ORDER_CREATED)"] -->|Murmur2('user_42') % 3 = 1| P1[Partition 1]
    E2["Event 2: key='user_42' (PAYMENT_PROCESSED)"] -->|Murmur2('user_42') % 3 = 1| P1
    E3["Event 3: key='user_99' (ORDER_CREATED)"] -->|Murmur2('user_99') % 3 = 2| P2[Partition 2]
```

Because Partition 1 is an append-only log consumed sequentially by a single consumer worker, `Event 1` is guaranteed to be processed before `Event 2`.

---

## 3. The Hot Partition Trap (Key Skew)

> [!WARNING]
> **Beware of Low-Cardinality or Skewed Keys!**
> If you set `key = countryCode` and 90% of your users are in `US`, Partition `murmur2('US')` will receive 90% of total traffic, causing CPU exhaustion and consumer lag while other partitions sit idle.

**Best Practices for Key Selection:**
- ✅ High-cardinality unique entity IDs: `userId`, `orderId`, `deviceId`, `tenantId`.
- ❌ Low-cardinality status codes or boolean flags: `status: "SUCCESS"`, `gender: "M"`.

---

## 4. Next Steps
Go to [10-replication.md](file:///c:/Users/Sulaiman/Desktop/pratice-dev/docs/10-replication.md) to understand broker replication, ISR quorums, and leader election.
