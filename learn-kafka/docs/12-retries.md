# 12 — Retry Architecture & Exponential Backoff

## 1. The Head-of-Line Blocking Trap

If a consumer encounters a temporary failure (e.g., downstream payment gateway 503 error) and loops endlessly trying to reprocess that one message, **all subsequent messages in that partition are blocked**!

```text
[Msg 1: Valid] -> [Msg 2: FAILING RETRY LOOP 🛑] -> [Msg 3: Blocked] -> [Msg 4: Blocked]
```

---

## 2. Non-Blocking Retry Architecture: Topic-Based Backoff

To prevent Head-of-Line blocking, forward failing messages to dedicated **Retry Topics** with increasing delays:

```mermaid
flowchart TD
    Main[orders.created] -->|Fails (Attempt 1)| Retry1[orders.created.retry-5s]
    Retry1 -->|Fails (Attempt 2)| Retry2[orders.created.retry-30s]
    Retry2 -->|Fails (Attempt 3)| DLT[orders.created.DLT]
```

### Flow:
1. **Main Consumer**: Tries processing. If failure is transient, publishes message to `orders.created.retry-5s` with header `x-retry-count: 1`, then commits offset on the main topic.
2. **Retry Worker**: Polls `retry-5s` topic, checks message timestamp, sleeps until 5s delay is met, and attempts reprocessing.
3. If max retries exceeded, forwards payload to the **Dead Letter Topic (DLT)**.

---

## 3. Transient vs. Permanent Errors

| Error Type | Examples | Action |
| :--- | :--- | :--- |
| **Transient** | Database connection timeout, Redis rate limit, HTTP 503 | Send to **Retry Topic** with exponential backoff |
| **Permanent (Poison Pill)** | Malformed JSON, missing required fields, `400 Bad Request` | Send **immediately to Dead Letter Topic (DLT)** |

---

## 4. Next Steps
Go to [13-dead-letter-topics.md](file:///c:/Users/Sulaiman/Desktop/pratice-dev/docs/13-dead-letter-topics.md) to inspect and recover unprocessable messages in a Dead Letter Topic.
