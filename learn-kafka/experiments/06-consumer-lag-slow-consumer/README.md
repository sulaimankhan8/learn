# Experiment 06 — Slow Consumer & Consumer Lag Explosion

## What We Are Breaking / Testing
A producer sends 100 messages in 1 second. The consumer simulates a slow downstream legacy database (taking 100ms per record).
We query and observe the **Consumer Lag** explode to 99 messages and slowly drain.

## Run
```bash
npm run exp:06:lag
# Or: node experiments/06-consumer-lag-slow-consumer/run.js
```

## Takeaway
Consumer lag is the #1 operational health metric in Kafka. When lag grows uncontrollably, you must either scale consumer instances, batch downstream operations, or increase partitions.
