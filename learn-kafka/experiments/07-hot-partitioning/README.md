# Experiment 07 — Hot Partition Key Skew

## What We Are Breaking / Testing
We send 100 messages where 90% have key `US` and 10% have unique user IDs.
We inspect partition message counts across 3 partitions and observe how one single partition receives 90% of all traffic!

## Run
```bash
npm run exp:07:hot-partition
# Or: node experiments/07-hot-partitioning/run.js
```

## Takeaway
Never use low-cardinality values (e.g. country, status, boolean) as Kafka message keys. Always choose high-cardinality keys (like `userId` or `uuid`) to maintain balanced distribution.
