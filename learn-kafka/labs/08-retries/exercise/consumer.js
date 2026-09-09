import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'exercise08-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// TODO: Implement a 2-tier retry system:
// orders.payment -> orders.payment.retry-1 -> orders.payment.retry-2 -> orders.payment.DLT
// Check message headers ('x-retry-count') to decide next destination.
