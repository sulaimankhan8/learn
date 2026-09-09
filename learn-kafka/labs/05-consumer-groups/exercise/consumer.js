import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'scaling-exercise',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// TODO 1: Initialize consumer with groupId 'scaling-exercise-group'
// TODO 2: Add event listener for consumer.events.GROUP_JOIN and print assigned partition count
// TODO 3: Subscribe to 'orders-group-test' and run message handler
