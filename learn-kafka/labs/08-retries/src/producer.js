import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab08-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

async function run() {
  await producer.connect();

  const orders = [
    { orderId: 'ORD-SUCCESS-1', flaky: false },
    { orderId: 'ORD-FAIL-TEMPORARY', flaky: true },
    { orderId: 'ORD-SUCCESS-2', flaky: false }
  ];

  for (const o of orders) {
    await producer.send({
      topic: 'orders.payment',
      messages: [{ key: o.orderId, value: JSON.stringify(o) }]
    });
    console.log(`📤 Published ${o.orderId}`);
  }

  await producer.disconnect();
}

run().catch(console.error);
