# Experiment 04 — Crash Before Commit (Duplicate Processing)

## What We Are Breaking / Testing
We process a charge of $100. The application completes the charge, but crashes before `commitOffsets()` reaches the Kafka broker.
Upon restarting, the consumer re-fetches the uncommitted offset and attempts the same charge a second time!

## Run
```bash
npm run exp:04:duplicates
# Or: node experiments/04-duplicate-messages/run.js
```

## Takeaway
This experiment proves why **At-Least-Once delivery is inherent to distributed systems**. Applications MUST implement consumer idempotency (like deduplication tables) to guard against duplicate side effects.
