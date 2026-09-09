import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'solution07-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'batch-commit-group' });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'finance.invoices.v1', fromBeginning: true });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      const offsetNum = Number(message.offset);
      console.log(`Processing offset ${offsetNum}`);

      if (offsetNum % 2 === 0) {
        const next = (BigInt(message.offset) + 1n).toString();
        await consumer.commitOffsets([{ topic, partition, offset: next }]);
        console.log(`Committed checkpoint at ${next}`);
      }
    }
  });
}

run().catch(console.error);
