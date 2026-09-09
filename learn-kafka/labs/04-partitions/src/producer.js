import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab04-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const admin = kafka.admin();
const producer = kafka.producer();

async function run() {
  await admin.connect();
  const topicName = 'multi-partition.v1';

  // Ensure 3 partitions exist
  await admin.createTopics({
    topics: [{ topic: topicName, numPartitions: 3, replicationFactor: 1 }]
  });
  await admin.disconnect();

  await producer.connect();
  console.log(`📤 Producing 9 unkeyed messages to ${topicName}...`);

  for (let i = 1; i <= 9; i++) {
    const payload = { id: i, text: `Message #${i}`, timestamp: Date.now() };
    const res = await producer.send({
      topic: topicName,
      messages: [{ value: JSON.stringify(payload) }] // No key!
    });
    console.log(`   Message #${i} -> Partition ${res[0].partition} (Offset ${res[0].baseOffset})`);
  }

  await producer.disconnect();
}

run().catch(console.error);
