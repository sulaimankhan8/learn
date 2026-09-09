# Beginner Exercises & Knowledge Check

## 📝 1. Quick Quiz

1. **How does Kafka differ from a traditional message queue like RabbitMQ?**
   - A) Kafka deletes messages immediately after one consumer reads them.
   - B) Kafka is an immutable, append-only distributed commit log where records are retained on disk for a configured time.
   - C) Kafka only runs in memory and loses all data on restart.

2. **What determines which partition a message is written to when a message key is supplied?**
   - A) Random selection
   - B) The consumer group leader
   - C) Murmur2 hash of the key modulo the number of partitions

3. **If a topic has 3 partitions and a consumer group has 4 consumers, what happens to the 4th consumer?**
   - A) It reads from all 3 partitions simultaneously.
   - B) It sits completely idle because each partition can only be consumed by at most one member in a consumer group.
   - C) It crashes with an error.

4. **What does `fromBeginning: true` mean in KafkaJS?**
   - A) The consumer will ignore all past committed offsets and always read from offset 0 every time it starts.
   - B) If no committed offset exists for this consumer group, it begins reading from the earliest available offset; otherwise it resumes from the committed offset.
   - C) It deletes all messages from the beginning of the topic.

---

## 🐛 2. Debugging Challenge: Spot the Bug!

Look at this broken consumer code. Why is it failing to process new messages on restart?

```javascript
const consumer = kafka.consumer({ groupId: 'my-service-group' });
await consumer.connect();
await consumer.subscribe({ topic: 'orders' });

await consumer.run({
  autoCommit: false,
  eachMessage: async ({ message }) => {
    const data = JSON.parse(message.value.toString());
    await saveToDatabase(data);
    // BUG HERE: Why does restarting this consumer reprocess every message from the beginning?
  }
});
```

<details>
<summary>🔍 Reveal Solution</summary>

**Problem:** `autoCommit` is set to `false`, but `consumer.commitOffsets()` is never called!
Because the consumer never commits its offset back to `__consumer_offsets`, Kafka assumes no records were processed, re-delivering everything on restart.

**Fix:** Add `await consumer.commitOffsets([{ topic, partition, offset: (BigInt(message.offset) + 1n).toString() }]);`
</details>

---

## 🏛️ 3. Architecture Challenge

> **Scenario:** A ride-sharing app needs to track GPS location pings from 50,000 drivers every 3 seconds.
> **Requirements:**
> 1. Location updates for a specific driver must be processed strictly in order.
> 2. The system must support high throughput.
>
> **Question:** How would you design the topic name, partition count, and message key?

<details>
<summary>🔍 Reveal Solution</summary>

- **Topic Name:** `telemetry.driver-location.v1`
- **Partition Count:** 12 to 24 partitions (to spread load across multiple consumers).
- **Message Key:** `driverId` (ensures all location pings for the same driver always land on the same partition in sequential timestamp order).
</details>

---

## 💼 4. Common Interview Questions

1. *What is an ISR in Kafka, and why is it important?*
2. *What is the role of the Partition Leader vs Follower?*
3. *Why does Kafka not support decreasing the number of partitions on an existing topic?*
