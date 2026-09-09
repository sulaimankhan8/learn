import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab07-manual-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'invoice-manual-group' });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'finance.invoices.v1', fromBeginning: true });

  console.log('🔄 Running manual offset commit consumer...');

  await consumer.run({
    autoCommit: false, // Disables automatic periodic committing
    eachMessage: async ({ topic, partition, message }) => {
      const invoice = JSON.parse(message.value.toString());
      console.log(`⏳ Processing ${invoice.invoiceId} (Offset ${message.offset})...`);

      // Simulate asynchronous database update
      await new Promise((r) => setTimeout(r, 200));

      // Manually commit offset + 1
      const nextOffset = (BigInt(message.offset) + 1n).toString();
      await consumer.commitOffsets([
        { topic, partition, offset: nextOffset }
      ]);
      console.log(`✅ Committed offset ${nextOffset} for partition ${partition}`);
    }
  });
}

run().catch(console.error);
