import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab02-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

async function run() {
  await producer.connect();

  const sampleOrders = [
    { orderId: 'ORD-2001', userId: 'USER-5510', amount: 89.50 },
    { orderId: 'ORD-2002', userId: 'USER-1199', amount: 24.99 },
    { orderId: 'ORD-2003', userId: 'USER-5510', amount: 310.00 }
  ];

  for (const order of sampleOrders) {
    const payload = {
      ...order,
      eventId: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };

    const res = await producer.send({
      topic: 'orders.v1',
      messages: [
        {
          key: order.userId,
          value: JSON.stringify(payload),
          headers: { source: 'web-checkout' }
        }
      ]
    });

    console.log(`📤 Published ${order.orderId} to Partition ${res[0].partition} (Offset ${res[0].baseOffset})`);
    await new Promise((r) => setTimeout(r, 400));
  }

  await producer.disconnect();
}

run().catch(console.error);
