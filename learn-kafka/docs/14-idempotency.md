# 14 — Idempotency & Deduplication

## 1. What is Idempotence?

An operation is **idempotent** if executing it multiple times produces the exact same system state as executing it once:

$$f(f(x)) = f(x)$$

Example:
- `SET account_balance = 100` is **Idempotent** (running 10 times leaves balance at 100).
- `INCREMENT account_balance BY 100` is **NOT Idempotent** (running 10 times adds 1000).

---

## 2. Producer-Level Idempotency (`idempotent: true`)

When `idempotent: true` is enabled in KafkaJS:
1. The broker assigns each producer a unique **Producer ID (PID)**.
2. Each batch sent to a partition is tagged with a monotonically increasing **Sequence Number**.
3. If the broker receives a batch with a Sequence Number it has already committed to disk, it acknowledges the batch without writing a duplicate record.

```javascript
const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 1 // or up to 5 in modern Kafka
});
```

---

## 3. Consumer-Level Idempotency: PostgreSQL Deduplication Table

To prevent duplicate side-effects when re-reading from Kafka, use an atomic database transaction with an `idempotency_keys` or `processed_events` table:

```sql
CREATE TABLE IF NOT EXISTS processed_events (
  event_id VARCHAR(255) PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Node.js Implementation:

```javascript
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function processOrderEvent(event) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Attempt to register event ID
    const insertEventResult = await client.query(
      `INSERT INTO processed_events (event_id, topic)
       VALUES ($1, $2)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING event_id`,
      [event.eventId, 'orders']
    );

    // If no row returned, this event was already processed!
    if (insertEventResult.rowCount === 0) {
      console.log(`⚠️ Event ${event.eventId} already processed. Skipping duplicate.`);
      await client.query('ROLLBACK');
      return;
    }

    // Execute business logic inside same transaction
    await client.query(
      `INSERT INTO orders (id, user_id, amount, status)
       VALUES ($1, $2, $3, $4)`,
      [event.orderId, event.userId, event.amount, 'CONFIRMED']
    );

    await client.query('COMMIT');
    console.log(`✅ Order ${event.orderId} processed successfully.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

---

## 4. Next Steps
Go to [15-schema-management.md](file:///c:/Users/Sulaiman/Desktop/pratice-dev/docs/15-schema-management.md) to manage event schemas safely without breaking downstream consumers.
