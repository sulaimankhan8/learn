import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab04-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'partition-demo-group' });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'multi-partition.v1', fromBeginning: true });

  console.log('👂 Listening across all assigned partitions...');

  await consumer.run({
    eachMessage: async ({ partition, message }) => {
      console.log(`📥 Received on [Partition ${partition}] | Offset: ${message.offset} | Value: ${message.value.toString()}`);
    }
  });
}

run().catch(console.error);
