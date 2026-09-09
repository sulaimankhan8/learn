import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'solution08-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'multi-tier-retry-group' });

async function routeError(topic, message, error) {
  const count = parseInt(message.headers?.['x-retry-count']?.toString() || '0', 10);
  let nextTopic = '';

  if (count === 0) nextTopic = `${topic}.retry-1`;
  else if (count === 1) nextTopic = `${topic}.retry-2`;
  else nextTopic = `${topic}.DLT`;

  await producer.send({
    topic: nextTopic,
    messages: [{
      key: message.key,
      value: message.value,
      headers: {
        ...message.headers,
        'x-retry-count': (count + 1).toString(),
        'x-error': error.message
      }
    }]
  });
  console.log(`Routed to ${nextTopic}`);
}

async function run() {
  await producer.connect();
  await consumer.connect();
  console.log('Multi-tier retry system initialized.');
}

run().catch(console.error);
