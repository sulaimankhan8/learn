import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'exercise-admin',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const admin = kafka.admin();

async function run() {
  await admin.connect();

  // TODO 1: Create a topic named 'exercise.short-lived.v1' with 4 partitions
  // and retention.ms set to 3600000 (1 hour).

  // TODO 2: Describe the metadata of the newly created topic.

  // TODO 3: Disconnect cleanly.
}

run().catch(console.error);
