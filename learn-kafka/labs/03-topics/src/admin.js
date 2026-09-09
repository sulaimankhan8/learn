import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab03-admin',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  logLevel: logLevel.INFO
});

const admin = kafka.admin();

async function run() {
  await admin.connect();
  console.log('✅ Admin client connected');

  const topicName = 'analytics.pageviews.v1';

  console.log(`🔨 Creating topic: ${topicName} with 3 partitions...`);
  const created = await admin.createTopics({
    waitForLeaders: true,
    topics: [
      {
        topic: topicName,
        numPartitions: 3,
        replicationFactor: 1,
        configEntries: [
          { name: 'retention.ms', value: '86400000' }, // 24 hours
          { name: 'cleanup.policy', value: 'delete' }
        ]
      }
    ]
  });

  console.log(created ? '✅ Topic created!' : 'ℹ️ Topic already existed.');

  console.log('\n📋 Fetching list of all topics...');
  const topics = await admin.listTopics();
  console.log('   Available topics:', topics.filter((t) => !t.startsWith('__')));

  console.log(`\n🔍 Describing topic metadata: ${topicName}`);
  const metadata = await admin.fetchTopicMetadata({ topics: [topicName] });
  const topicMeta = metadata.topics[0];

  console.log(`   Topic: ${topicMeta.name}`);
  console.log(`   Total Partitions: ${topicMeta.partitions.length}`);
  topicMeta.partitions.forEach((p) => {
    console.log(`     Partition ${p.partitionId} -> Leader Broker: ${p.leader} | Replicas: [${p.replicas.join(',')}] | ISR: [${p.isr.join(',')}]`);
  });

  await admin.disconnect();
  console.log('\n🔌 Admin client disconnected.');
}

run().catch(console.error);
