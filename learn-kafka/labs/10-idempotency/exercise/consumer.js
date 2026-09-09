import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'exercise10-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// TODO: Create a consumer with a custom Redis or in-memory Set cache for event IDs
// Skip any message whose eventId has already been seen within the last 10 minutes.
