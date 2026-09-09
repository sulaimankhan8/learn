import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'exercise06-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

// TODO: Produce lifecycle events (ORDER_CREATED, PAYMENT_SUCCESS, ORDER_SHIPPED)
// for 3 distinct order IDs (ORD-1, ORD-2, ORD-3) using orderId as the message key.
// Verify that events for each order are routed to the same partition consistently.
