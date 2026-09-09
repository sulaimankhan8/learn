import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab10-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// Idempotent producer enables broker deduplication during retries
const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 1
});

async function run() {
  await producer.connect();

  const duplicateEvent = {
    eventId: 'evt_dup_999',
    orderId: 'ORD-FINANCE-77',
    userId: 'USER-99',
    amount: 500.00
  };

  console.log('📤 Producing 3 events with the SAME eventId (evt_dup_999)...');

  for (let i = 1; i <= 3; i++) {
    await producer.send({
      topic: 'finance.charges.v1',
      messages: [
        {
          key: duplicateEvent.orderId,
          value: JSON.stringify(duplicateEvent),
          headers: { 'attempt': i.toString() }
        }
      ]
    });
    console.log(`   Attempt #${i} sent.`);
    await new Promise((r) => setTimeout(r, 300));
  }

  await producer.disconnect();
}

run().catch(console.error);
