import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'solution09-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'validation-guard-group' });

async function run() {
  await producer.connect();
  await consumer.connect();

  await consumer.subscribe({ topic: 'payments.requests' });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const payment = JSON.parse(message.value.toString());
      if (payment.amount <= 0) {
        console.error(`Invalid payment amount: ${payment.amount}`);
        await producer.send({
          topic: `${topic}.DLT`,
          messages: [{
            key: message.key,
            value: message.value,
            headers: { 'x-validation-error': 'Amount must be greater than zero' }
          }]
        });
        return;
      }
      console.log(`Payment valid: ${payment.amount}`);
    }
  });
}

run().catch(console.error);
