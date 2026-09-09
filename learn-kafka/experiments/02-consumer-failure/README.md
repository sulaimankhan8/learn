# Experiment 02 — Consumer Sudden Crash & Resume

## What We Are Breaking / Testing
We produce 10 messages. A consumer starts processing, prints message 1..4, and crashes abruptly (simulated `process.exit(1)`).
A secondary consumer starts up under the same `groupId` and resumes cleanly from message 5 without missing records.

## Run
```bash
npm run exp:02:failure
# Or: node experiments/02-consumer-failure/run.js
```

## Takeaway
Committed offsets allow Kafka consumer groups to be fully fault-tolerant. When a container is restarted by Kubernetes or Docker, it picks up exactly where the previous instance left off.
