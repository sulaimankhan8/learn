import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'solution10-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'cache-dedup-group' });
const cache = new Map();

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'finance.charges.v1', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const payload = JSON.parse(message.value.toString());
      if (cache.has(payload.eventId)) {
        console.log(`Skipped duplicate: ${payload.eventId}`);
        return;
      }
      cache.set(payload.eventId, Date.now());
      console.log(`Processed: ${payload.eventId}`);
    }
  });
}

run().catch(console.error);
