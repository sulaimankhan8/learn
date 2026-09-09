import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab07-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

async function run() {
  await producer.connect();
  console.log('📤 Producing 5 invoices...');

  for (let i = 1; i <= 5; i++) {
    await producer.send({
      topic: 'finance.invoices.v1',
      messages: [{ key: `INV-${i}`, value: JSON.stringify({ invoiceId: `INV-${i}`, total: i * 50 }) }]
    });
  }
  console.log('✅ 5 invoices sent.');
  await producer.disconnect();
}

run().catch(console.error);
