import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'solution-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'order-analytics-group' });
let totalRevenue = 0;

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'orders.v1', fromBeginning: true });

  console.log('📊 Running revenue tracker...');

  await consumer.run({
    eachMessage: async ({ message }) => {
      const payload = JSON.parse(message.value.toString());
      totalRevenue += Number(payload.amount || 0);
      console.log(`💰 Added $${payload.amount} | Running Total Revenue: $${totalRevenue.toFixed(2)}`);
    }
  });
}

run().catch(console.error);
