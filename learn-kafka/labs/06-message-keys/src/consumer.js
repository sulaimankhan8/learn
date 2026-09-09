import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab06-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'keyed-consumer-group' });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'keyed-user-events.v1', fromBeginning: true });

  console.log('👂 Listening for keyed events...');

  await consumer.run({
    eachMessage: async ({ partition, message }) => {
      const key = message.key?.toString();
      const payload = JSON.parse(message.value.toString());
      console.log(`📥 [Partition ${partition}] Key: ${key.padEnd(12)} | Action: ${payload.step}`);
    }
  });
}

run().catch(console.error);
