import { Kafka } from 'kafkajs';
import pg from 'pg';

const kafka = new Kafka({
  clientId: 'lab10-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'idempotent-charge-group' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://course_user:course_password@localhost:5432/course_db'
});

// Fallback in-memory set if Postgres is offline
const inMemoryDeduplicationSet = new Set();

async function initDB() {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS processed_events (
        event_id VARCHAR(255) PRIMARY KEY,
        topic VARCHAR(255) NOT NULL,
        processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    client.release();
    console.log('✅ PostgreSQL processed_events table ready.');
    return true;
  } catch (err) {
    console.warn('ℹ️ PostgreSQL unavailable. Using in-memory deduplication set.');
    return false;
  }
}

async function isDuplicate(eventId, topic, useDB) {
  if (!useDB) {
    if (inMemoryDeduplicationSet.has(eventId)) return true;
    inMemoryDeduplicationSet.add(eventId);
    return false;
  }

  const client = await pool.connect();
  try {
    const res = await client.query(
      `INSERT INTO processed_events (event_id, topic) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
      [eventId, topic]
    );
    return res.rowCount === 0;
  } finally {
    client.release();
  }
}

async function run() {
  const useDB = await initDB();

  await consumer.connect();
  await consumer.subscribe({ topic: 'finance.charges.v1', fromBeginning: true });

  console.log('🛡️ Idempotent consumer listening for finance charges...');

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const event = JSON.parse(message.value.toString());
      const attempt = message.headers?.attempt?.toString() || '1';

      console.log(`\n📥 Received Message (Event ID: ${event.eventId} | Attempt: ${attempt})`);

      const duplicate = await isDuplicate(event.eventId, topic, useDB);
      if (duplicate) {
        console.log(`⚠️ DUPLICATE DETECTED! Event ${event.eventId} already processed. Skipping business action.`);
        return;
      }

      console.log(`💳 Processing payment of $${event.amount} for Order ${event.orderId} (FIRST TIME)`);
    }
  });
}

run().catch(console.error);
