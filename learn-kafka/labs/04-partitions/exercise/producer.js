import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'exercise04-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

async function run() {
  await producer.connect();
  // TODO: Send 60 unkeyed messages to 'multi-partition.v1'
  // Track counts in an object: { '0': 0, '1': 0, '2': 0 }
  // Print the final count per partition!

  await producer.disconnect();
}

run().catch(console.error);
