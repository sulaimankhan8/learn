import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'solution11-tx',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer({
  transactionalId: `transfer-tx-${Date.now()}`,
  idempotent: true
});

async function run() {
  await producer.connect();
  const tx = await producer.transaction();

  try {
    await tx.send({
      topic: 'finance.transfers.v1',
      messages: [
        { key: 'ACC-A', value: JSON.stringify({ account: 'ACC-A', delta: -50 }) },
        { key: 'ACC-B', value: JSON.stringify({ account: 'ACC-B', delta: +50 }) }
      ]
    });
    await tx.commit();
    console.log('✅ Transfer committed atomically.');
  } catch (err) {
    await tx.abort();
    console.error('Transfer aborted:', err);
  } finally {
    await producer.disconnect();
  }
}

run().catch(console.error);
