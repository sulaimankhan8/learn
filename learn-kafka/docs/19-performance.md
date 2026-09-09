# 19 — Performance Tuning, Batching & Compression

## 1. The Throughput vs. Latency Trade-Off

| Metric | Definition | Optimization Strategy |
| :--- | :--- | :--- |
| **Throughput** | Number of megabytes or messages processed per second | Increase batch sizes (`batchSize`), enable compression (Snappy/GZIP), allow small delay (`linger.ms`) |
| **Latency** | Milliseconds from message publication until consumer receipt | Send immediately (`linger.ms = 0`), smaller batches, uncompressed or LZ4 |

---

## 2. Key Producer Tuning Knobs

1. **`batchSize` (Kafka default 16KB)**: Max bytes accumulated per partition batch before sending. For high throughput, increase to `64KB` or `128KB`.
2. **`linger.ms` (KafkaJS `maxWaitTimeInMs`)**: Delay to wait for more messages before sending batch. Setting `5ms`–`20ms` can increase throughput by $5\times$ to $10\times$ with negligible latency increase.
3. **`compression`**:
   - `Snappy` / `LZ4`: Ultra-fast CPU compression, ideal for high throughput.
   - `GZIP` / `ZSTD`: Highest compression ratio, ideal for bandwidth-constrained cloud networks.

---

## 3. Key Consumer Tuning Knobs

1. **`maxBytesPerPartition` (default 1MB)**: Max data fetched per partition per request.
2. **`minBytes` (default 1 byte)**: Minimum bytes the broker should wait to collect before responding to consumer poll.
3. **`maxWaitTimeInMs` (default 5000ms)**: Max time broker will wait to satisfy `minBytes` before returning available records.

---

## 4. Next Steps
Go to [20-monitoring.md](file:///c:/Users/Sulaiman/Desktop/pratice-dev/docs/20-monitoring.md) to track consumer lag and broker health.
