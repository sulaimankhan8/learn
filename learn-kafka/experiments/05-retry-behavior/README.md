# Experiment 05 — Transient Error Retry Routing

## What We Are Breaking / Testing
We send a message that fails 2 times due to simulated 503 errors before finally succeeding on attempt 3 in the retry topic.

## Run
```bash
npm run exp:05:retries
# Or: node experiments/05-retry-behavior/run.js
```

## Takeaway
Topic-based retries allow non-blocking asynchronous healing without halting the main ingestion stream.
