import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab09-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

async function run() {
  await producer.connect();

  console.log('📤 Sending 1 valid order, 1 corrupt poison pill, and 1 valid order...');

  // 1. Valid Order
  await producer.send({
    topic: 'orders.incoming',
    messages: [{ key: 'ORD-1', value: JSON.stringify({ orderId: 'ORD-1', amount: 50.00 }) }]
  });

  // 2. Corrupt Poison Pill (Not valid JSON!)
  await producer.send({
    topic: 'orders.incoming',
    messages: [{ key: 'CORRUPT-KEY', value: '{{{NOT_VALID_JSON_CORRUPTED_PAYLOAD' }]
  });

  // 3. Valid Order
  await producer.send({
    topic: 'orders.incoming',
    messages: [{ key: 'ORD-2', value: JSON.stringify({ orderId: 'ORD-2', amount: 99.99 }) }]
  });

  console.log('✅ All 3 messages produced.');
  await producer.disconnect();
}

run().catch(console.error);
