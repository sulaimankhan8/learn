# Lab 05 — Consumer Groups & Scaling

## Objective
Observe dynamic partition assignment, rebalancing, and load sharing by launching multiple consumer processes sharing the same `groupId`.

## Architecture
```mermaid
flowchart TB
    subgraph Topic: orders-group-test (3 Partitions)
        P0[Partition 0]
        P1[Partition 1]
        P2[Partition 2]
    end

    subgraph ConsumerGroup [Consumer Group: order-scaling-group]
        C1[Consumer 1: Assigned P0, P1]
        C2[Consumer 2: Assigned P2]
    end

    P0 --> C1
    P1 --> C1
    P2 --> C2
```

## Run

### Step 1: Open 3 terminal tabs
- **Terminal 1**: `node labs/05-consumer-groups/src/consumer.js worker-A`
- **Terminal 2**: `node labs/05-consumer-groups/src/consumer.js worker-B`
- **Terminal 3**: `node labs/05-consumer-groups/src/consumer.js worker-C`

### Step 2: In Terminal 4, produce messages continuously
```bash
node labs/05-consumer-groups/src/producer.js
```

## Observe
- When only `worker-A` is running, it receives all 3 partitions (0, 1, 2).
- When `worker-B` joins, Kafka rebalances: `worker-A` gets 2 partitions, `worker-B` gets 1.
- When `worker-C` joins, each worker gets exactly 1 partition!
- **Now start a 4th worker (`worker-D`)**: Notice `worker-D` receives **0 partitions** and sits completely idle!

## Challenge
Kill `worker-A` (`Ctrl+C`) while the producer is still running. Watch how `worker-D` automatically gets woken up and assigned the orphaned partition!

## Questions
1. Why can 4 consumers not divide 3 partitions equally?
2. What is a "rebalance storm" and why is it dangerous?
