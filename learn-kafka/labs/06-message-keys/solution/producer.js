import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'solution06-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

async function run() {
  await producer.connect();

  const orders = ['ORD-1', 'ORD-2', 'ORD-3'];
  const stages = ['ORDER_CREATED', 'PAYMENT_SUCCESS', 'ORDER_SHIPPED'];

  for (const stage of stages) {
    for (const orderId of orders) {
      const res = await producer.send({
        topic: 'keyed-user-events.v1',
        messages: [
          { key: orderId, value: JSON.stringify({ orderId, stage, timestamp: Date.now() }) }
        ]
      });
      console.log(`Delivered [${orderId}] ${stage} -> Partition ${res[0].partition}`);
    }
  }

  await producer.disconnect();
}

run().catch(console.error);
