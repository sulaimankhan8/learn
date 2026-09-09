# Lab 04 — Partitions & Load Distribution

## Objective
Demonstrate how messages are distributed across multiple partitions when produced with and without message keys, and observe how consumer instances receive partition assignments.

## Prerequisites
- Completed Labs 01–03

## Architecture
```mermaid
flowchart LR
    P[Producer] -->|Round-Robin / Sticky (No Key)| T[Topic: multi-partition.v1]
    T --> P0[Partition 0]
    T --> P1[Partition 1]
    T --> P2[Partition 2]
    
    P0 --> C[Consumer]
    P1 --> C
    P2 --> C
```

## Run
### Step 1: Start the consumer
```bash
npm run lab:04:consumer
# Or: node labs/04-partitions/src/consumer.js
```

### Step 2: In another terminal, run the producer
```bash
npm run lab:04:producer
# Or: node labs/04-partitions/src/producer.js
```

## Observe
Look at the producer output:
```text
📤 Sent msg 1 -> Partition 0
📤 Sent msg 2 -> Partition 1
📤 Sent msg 3 -> Partition 2
📤 Sent msg 4 -> Partition 0
```
Notice how messages without keys are evenly spread across partitions 0, 1, and 2.

## Experiment
Pass a fixed key (e.g. `key: 'sensor-99'`) to all messages and re-run. What happens to the partition numbers?

## Challenge
Update `exercise/producer.js` to distribute 100 messages and calculate a distribution histogram showing how many messages landed in each partition.

## Questions
1. Why does an unkeyed message get distributed across partitions while a keyed message does not?
2. What algorithm does KafkaJS use to map keys to partitions? (Murmur2)
