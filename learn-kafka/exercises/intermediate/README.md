# Intermediate Exercises & Knowledge Check

## 📝 1. Quick Quiz

1. **What is the difference between `acks: 1` and `acks: -1` (`acks: all`)?**
   - A) `acks: 1` waits for only the leader broker to write to disk; `acks: -1` waits for the leader AND all In-Sync Replicas (ISR).
   - B) `acks: -1` disables acknowledgments completely.
   - C) `acks: 1` sends 1 message at a time.

2. **What causes a consumer rebalance?**
   - A) A new consumer joins the group.
   - B) An existing consumer crashes or leaves.
   - C) The partition count of a subscribed topic changes.
   - D) All of the above.

3. **What is "Head-of-Line Blocking" in Kafka consumers?**
   - A) When a producer sends messages faster than the network.
   - B) When a single failing message in a partition retry loop stops all subsequent messages in that partition from being processed.
   - C) When Kafka blocks new topics from being created.

---

## 🐛 2. Debugging Challenge: Spot the Bug!

Look at this producer code. Under network retries, why might messages end up duplicated or out-of-order on the broker?

```javascript
const producer = kafka.producer({
  maxInFlightRequests: 5,
  idempotent: false, // BUG!
  retry: { retries: 10 }
});
```

<details>
<summary>🔍 Reveal Solution</summary>

**Problem:** With `maxInFlightRequests: 5` and `idempotent: false`, if Request #1 encounters a network timeout and retries *after* Request #2 has already succeeded on the broker, messages will land **out of order and duplicated** on disk!

**Fix:** Enable `idempotent: true`. In modern Kafka, idempotent producers assign sequence numbers to each batch, preserving strict in-flight ordering and deduplicating retries.
</details>

---

## 🏛️ 3. Architecture Challenge: Payment Notification Reliability

> **Scenario:** An e-commerce platform processes 10,000 orders/minute. Sometimes the external SMS provider returns 503 HTTP errors.
> **Question:** How should the consumer handle SMS provider 503 errors without blocking other users' orders and without losing failed messages?

<details>
<summary>🔍 Reveal Solution</summary>

Implement a **Non-Blocking Topic-Based Retry Architecture**:
1. When SMS API fails with 503 (transient error), the worker publishes the record to `notifications.sms.retry-1` with header `x-retry-count: 1`, then commits offset on the main topic.
2. A separate retry worker consumes `notifications.sms.retry-1` with a delayed interval.
3. If max retries are exceeded, the event is routed to `notifications.sms.DLT` for manual review.
</details>

---

## 💼 4. Intermediate Interview Questions

1. *What happens if a consumer's processing logic takes longer than `sessionTimeout` or `maxPollInterval`?*
2. *How do you choose between `eachMessage` vs `eachBatch` in KafkaJS?*
3. *What is the difference between Log Compaction (`cleanup.policy=compact`) and Log Deletion (`cleanup.policy=delete`)?*
