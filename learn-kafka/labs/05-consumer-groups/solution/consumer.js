import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'scaling-solution',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'scaling-exercise-group' });

async function run() {
  await consumer.connect();

  consumer.on(consumer.events.GROUP_JOIN, (e) => {
    console.log('Assignments:', e.payload.memberAssignment);
  });

  await consumer.subscribe({ topic: 'orders-group-test' });
  await consumer.run({
    eachMessage: async ({ partition, message }) => {
      console.log(`[P${partition}] ${message.value.toString()}`);
    }
  });
}

run().catch(console.error);
