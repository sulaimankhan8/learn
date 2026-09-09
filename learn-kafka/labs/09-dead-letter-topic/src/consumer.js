import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab09-main-worker',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'orders-dlt-protected-group' });

async function run() {
  await producer.connect();
  await consumer.connect();

  await consumer.subscribe({ topic: 'orders.incoming', fromBeginning: true });
  console.log('🛡️ Main worker listening with DLT protection...');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value.toString();
      try {
        const order = JSON.parse(raw);
        console.log(`✅ Successfully processed order ${order.orderId}`);
      } catch (err) {
        console.error(`💥 Poison pill detected on Partition ${partition}@${message.offset}! Routing to DLT...`);

        await producer.send({
          topic: 'orders.incoming.DLT',
          messages: [{
            key: message.key,
            value: message.value,
            headers: {
              'x-original-topic': topic,
              'x-original-partition': partition.toString(),
              'x-original-offset': message.offset,
              'x-error-message': err.message,
              'x-failed-at': new Date().toISOString()
            }
          }]
        });
        console.log(`➡️ Poison pill safely isolated in orders.incoming.DLT`);
      }
    }
  });
}

run().catch(console.error);
