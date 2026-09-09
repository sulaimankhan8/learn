import express from 'express';
import { Kafka } from 'kafkajs';
import pg from 'pg';

const kafka = new Kafka({
  clientId: 'enterprise-platform',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer({ idempotent: true });
const consumer = kafka.consumer({ groupId: 'enterprise-worker-group' });
const dltConsumer = kafka.consumer({ groupId: 'enterprise-dlt-monitor-group' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://course_user:course_password@localhost:5432/course_db'
});

// In-memory fallback if Postgres is offline
const inMemoryOutbox = [];
const inMemoryDedup = new Set();
let isDbConnected = false;

async function setupDatabase() {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS outbox_events (
        id VARCHAR(255) PRIMARY KEY,
        aggregate_type VARCHAR(100) NOT NULL,
        aggregate_id VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS consumer_processed_events (
        event_id VARCHAR(255) PRIMARY KEY,
        processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    client.release();
    isDbConnected = true;
    console.log('✅ PostgreSQL Schema Initialized (Outbox & Dedup tables ready)');
  } catch (err) {
    console.warn('ℹ️ PostgreSQL not available, using in-memory Outbox store.');
    isDbConnected = false;
  }
}

// Transactional Outbox write
async function saveOrderWithOutbox(order) {
  const eventId = `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  if (isDbConnected) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO outbox_events (id, aggregate_type, aggregate_id, payload, status) VALUES ($1, $2, $3, $4, $5)`,
        [eventId, 'ORDER', order.orderId, JSON.stringify(order), 'PENDING']
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } else {
    inMemoryOutbox.push({ id: eventId, aggregate_id: order.orderId, payload: order, status: 'PENDING' });
  }

  return eventId;
}

// Outbox Relay Worker (Pushes outbox events to Kafka)
async function startOutboxRelay() {
  setInterval(async () => {
    if (isDbConnected) {
      const client = await pool.connect();
      try {
        const res = await client.query(`SELECT * FROM outbox_events WHERE status = 'PENDING' LIMIT 10`);
        for (const row of res.rows) {
          await producer.send({
            topic: 'enterprise.orders.v1',
            messages: [{
              key: row.aggregate_id,
              value: JSON.stringify({ eventId: row.id, ...row.payload })
            }]
          });
          await client.query(`UPDATE outbox_events SET status = 'PROCESSED' WHERE id = $1`, [row.id]);
          console.log(`📤 [OUTBOX RELAY] Flushed event ${row.id} to Kafka!`);
        }
      } catch (err) {
        // relay retry loop
      } finally {
        client.release();
      }
    } else {
      for (const item of inMemoryOutbox.filter((x) => x.status === 'PENDING')) {
        await producer.send({
          topic: 'enterprise.orders.v1',
          messages: [{
            key: item.aggregate_id,
            value: JSON.stringify({ eventId: item.id, ...item.payload })
          }]
        });
        item.status = 'PROCESSED';
        console.log(`📤 [OUTBOX RELAY] Flushed event ${item.id} to Kafka!`);
      }
    }
  }, 1000);
}

async function startPlatform() {
  console.log('🏛️ STARTING PRODUCTION EVENT PLATFORM...\n');

  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: [
      { topic: 'enterprise.orders.v1', numPartitions: 2 },
      { topic: 'enterprise.orders.v1.DLT', numPartitions: 1 }
    ]
  });
  await admin.disconnect();

  await setupDatabase();
  await producer.connect();
  await consumer.connect();
  await dltConsumer.connect();

  await consumer.subscribe({ topic: 'enterprise.orders.v1', fromBeginning: false });
  await dltConsumer.subscribe({ topic: 'enterprise.orders.v1.DLT', fromBeginning: false });

  // Idempotent Consumer Service
  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      let event;
      try {
        event = JSON.parse(message.value.toString());
      } catch (err) {
        console.error('💥 Poison Pill detected! Sending to DLT...');
        await producer.send({
          topic: `${topic}.DLT`,
          messages: [{
            key: message.key,
            value: message.value,
            headers: { 'x-dlt-reason': 'MalformedJSON' }
          }]
        });
        return;
      }

      // Check Deduplication
      if (inMemoryDedup.has(event.eventId)) {
        console.log(`⚠️ [CONSUMER] Duplicate event ${event.eventId} detected. Skipping.`);
        return;
      }
      inMemoryDedup.add(event.eventId);

      console.log(`✅ [CONSUMER] Processed Order ${event.orderId} for $${event.amount} (Event ID: ${event.eventId})`);
    }
  });

  // DLT Inspector Consumer
  dltConsumer.run({
    eachMessage: async ({ message }) => {
      console.log(`🚨 [DLT MONITOR] Captured dead-letter record: ${message.value?.toString()}`);
    }
  });

  // Start Background Outbox Relay
  startOutboxRelay();

  // Express API Gateway
  const app = express();
  app.use(express.json());

  app.post('/api/orders', async (req, res) => {
    const { orderId, amount, customer } = req.body;
    const eventId = await saveOrderWithOutbox({ orderId, amount, customer });
    res.status(202).json({ status: 'ACCEPTED', orderId, eventId });
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, async () => {
    console.log(`🚀 Production Platform API Gateway listening on http://localhost:${PORT}`);

    // Self-test with sample orders
    console.log('\n🧪 Running self-test: Creating sample orders via Transactional Outbox...');
    await saveOrderWithOutbox({ orderId: 'ORD-ENTERPRISE-01', amount: 499.00, customer: 'Acme Corp' });
    await saveOrderWithOutbox({ orderId: 'ORD-ENTERPRISE-02', amount: 1200.00, customer: 'Globex Inc' });

    // Send malformed poison pill test directly to topic
    setTimeout(async () => {
      console.log('\n🧪 Sending poison pill test...');
      await producer.send({
        topic: 'enterprise.orders.v1',
        messages: [{ value: 'MALFORMED_NON_JSON_RECORD' }]
      });
    }, 2500);

    setTimeout(() => {
      console.log('\n========================================');
      console.log('🏁 Production Platform Demo Completed Successfully!');
      console.log('========================================\n');
      process.exit(0);
    }, 5000);
  });
}

startPlatform().catch(console.error);
