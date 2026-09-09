import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'exercise09-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// TODO: Build a consumer that processes payment events:
// If payload.amount <= 0, throw a BusinessValidationError and forward directly to DLT with headers!
