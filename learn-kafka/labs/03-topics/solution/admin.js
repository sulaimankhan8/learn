import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'solution-admin',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const admin = kafka.admin();

async function run() {
  await admin.connect();

  const topicName = 'exercise.short-lived.v1';
  await admin.createTopics({
    topics: [
      {
        topic: topicName,
        numPartitions: 4,
        replicationFactor: 1,
        configEntries: [{ name: 'retention.ms', value: '3600000' }]
      }
    ]
  });

  console.log(`✅ Created topic ${topicName}`);
  const metadata = await admin.fetchTopicMetadata({ topics: [topicName] });
  console.log('Metadata:', JSON.stringify(metadata, null, 2));

  await admin.disconnect();
}

run().catch(console.error);
