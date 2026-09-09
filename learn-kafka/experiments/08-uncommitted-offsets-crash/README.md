# Experiment 08 — Uncommitted Offset Crash & Replay Analysis

## What We Are Breaking / Testing
We produce 10 messages. A consumer reads 5 messages with `autoCommit: false` but never calls `commitOffsets()`.
The consumer process is terminated. Upon rebooting under the same consumer group, Kafka forces the consumer to reprocess all 10 messages from offset 0!

## Run
```bash
npm run exp:08:uncommitted
# Or: node experiments/08-uncommitted-offsets-crash/run.js
```

## Takeaway
Kafka guarantees that uncommitted messages will **never be skipped**. If a consumer fails before committing, every uncommitted record is replayed.
