import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'capstone-starter',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// TODO 1: Implement Idempotent Producer
// TODO 2: Implement Ingestion flow with Transactional Outbox
// TODO 3: Implement Real-time Fraud Detection Consumer
// TODO 4: Implement Settlement & Ledger Consumer with deduplication
// TODO 5: Implement DLT routing for invalid/poison pill records

console.log('Capstone starter ready. Implement tasks as specified in capstone/README.md!');
