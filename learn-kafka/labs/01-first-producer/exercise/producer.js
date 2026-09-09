import { Kafka } from 'kafkajs';

// TODO 1: Initialize Kafka client with clientId 'exercise-producer' and broker 'localhost:9092'
const kafka = new Kafka({
  // YOUR CODE HERE
});

// TODO 2: Create a producer instance
const producer = null; // YOUR CODE HERE

async function run() {
  // TODO 3: Connect the producer

  // TODO 4: Construct an order payload with orderId, userId, amount, and timestamp

  // TODO 5: Publish the message to topic 'orders.v1'

  // TODO 6: Log metadata (topic, partition, offset)

  // TODO 7: Gracefully disconnect
}

run().catch(console.error);
