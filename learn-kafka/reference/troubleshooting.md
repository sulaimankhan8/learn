# Kafka & KafkaJS Troubleshooting Guide

## 1. Common Errors & Immediate Fixes

### Error 1: `KafkaJSConnectionError: Connection timeout`
- **Cause:** Broker container is not running, or advertised listeners port is inaccessible from host.
- **Fix:** Run `npm run docker:status` to ensure `kafka-node-broker` is healthy. Verify `KAFKA_ADVERTISED_LISTENERS` matches `PLAINTEXT_HOST://localhost:9092`.

---

### Error 2: `The group is rebalancing, so a rejoin is needed`
- **Cause:** Your consumer's `eachMessage` or `eachBatch` callback blocked the Node.js event loop longer than `sessionTimeout` or `rebalanceTimeout`.
- **Fix:**
  1. Call `await heartbeat()` inside long-running loops.
  2. Increase `sessionTimeout: 45000` in consumer options.
  3. Offload heavy synchronous CPU work to `worker_threads`.

---

### Error 3: `UNKNOWN_TOPIC_OR_PARTITION`
- **Cause:** Topic does not exist, or broker has `KAFKA_AUTO_CREATE_TOPICS_ENABLE: false` and topic was not pre-created.
- **Fix:** Create topic using KafkaJS Admin API or CLI:
  ```bash
  docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic <name> --partitions 3
  ```

---

### Error 4: `OFFSET_OUT_OF_RANGE`
- **Cause:** The consumer requested an offset that has already been deleted by log retention cleanup (`retention.ms` or `retention.bytes`).
- **Fix:** Ensure `fromBeginning: true` is configured or reset group offset using `kafka-consumer-groups.sh --reset-offsets --to-earliest`.

---

### Error 5: `NOT_ENOUGH_REPLICAS`
- **Cause:** `acks: all` was requested, but fewer brokers are in the ISR than `min.insync.replicas`.
- **Fix:** Ensure all broker containers in the cluster are healthy, or lower `min.insync.replicas` in development.
