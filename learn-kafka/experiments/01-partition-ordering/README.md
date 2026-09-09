# Experiment 01 — Partition Ordering Skew

## What We Are Breaking / Testing
We intentionally produce a series of 20 sequentially numbered events across 3 partitions, and observe how the consumer receives them **out of order globally**, while maintaining **strict order within each individual partition**.

## Architecture
```mermaid
flowchart TD
    Producer -->|Msg 1 (P0)| P0[Partition 0: [1, 4, 7, 10]]
    Producer -->|Msg 2 (P1)| P1[Partition 1: [2, 5, 8, 11]]
    Producer -->|Msg 3 (P2)| P2[Partition 2: [3, 6, 9, 12]]
    
    P0 --> Consumer[Consumer Poll Loop]
    P1 --> Consumer
    P2 --> Consumer
    
    Consumer -->|Observed Global Order: 1, 4, 2, 5, 3...| Result[Global Skew Demonstrated!]
```

## Run
```bash
npm run exp:01:ordering
# Or: node experiments/01-partition-ordering/run.js
```

## Takeaway
Never design an event-driven system assuming global ordering across multi-partition topics! If entity ordering is required, always provide an entity key.
