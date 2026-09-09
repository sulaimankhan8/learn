# Experiment 03 — Dynamic Consumer Rebalancing Timeline

## What We Are Breaking / Testing
We observe the exact lifecycle events and partition redistribution timeline when a new consumer process dynamically joins an active consumer group.

## Run
```bash
npm run exp:03:rebalance
# Or: node experiments/03-consumer-rebalancing/run.js
```

## Takeaway
Rebalancing is the mechanism Kafka uses to achieve elastic scaling. During rebalances, partition consumption pauses briefly while the coordinator reassigns partitions.
