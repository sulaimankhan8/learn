import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'exercise07-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// TODO: Implement a consumer that:
// 1. Uses autoCommit: false
// 2. Commits offset only if message.offset is an EVEN number (simulating batch committing)
// 3. Implements consumer.seek() to replay from offset 0 when restarted
