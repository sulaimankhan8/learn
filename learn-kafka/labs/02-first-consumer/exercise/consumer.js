import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'exercise-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// TODO 1: Create a consumer with groupId 'order-analytics-group'
const consumer = null; // YOUR CODE HERE

let totalRevenue = 0;

async function run() {
  // TODO 2: Connect the consumer

  // TODO 3: Subscribe to 'orders.v1' with fromBeginning: true

  // TODO 4: In eachMessage, parse the JSON payload, add event.amount to totalRevenue,
  // and print the running total revenue!
}

run().catch(console.error);
