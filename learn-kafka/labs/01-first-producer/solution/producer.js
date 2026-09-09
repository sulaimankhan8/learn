import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'solution-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

async function run() {
  await producer.connect();
  console.log('✅ Connected solution producer');

  const payload = {
    orderId: 'ORD-9999',
    userId: 'USER-1234',
    amount: 299.95,
    timestamp: new Date().toISOString()
  };

  const metadata = await producer.send({
    topic: 'orders.v1',
    messages: [
      { key: payload.orderId, value: JSON.stringify(payload) }
    ]
  });

  console.log('✅ Delivered to:', metadata);
  await producer.disconnect();
}

run().catch(console.error);
