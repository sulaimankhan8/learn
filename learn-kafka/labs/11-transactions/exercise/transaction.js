import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'exercise11-tx',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// TODO: Initialize a transactional producer and execute an atomic transfer
// between two accounts (debit Account A, credit Account B).
