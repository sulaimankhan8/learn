import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'health-checker',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  logLevel: logLevel.NOTHING,
  retry: {
    initialRetryTime: 1000,
    retries: 30,
  },
});

const admin = kafka.admin();

async function checkKafka() {
  console.log('⏳ Connecting to Kafka at localhost:9092...');
  const startTime = Date.now();
  const maxWaitMs = 60000;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      await admin.connect();
      const cluster = await admin.describeCluster();
      console.log('✅ Kafka is READY!');
      console.log(`   Cluster ID: ${cluster.clusterId}`);
      console.log(`   Brokers: ${cluster.brokers.map(b => `${b.host}:${b.port} (ID: ${b.nodeId})`).join(', ')}`);
      await admin.disconnect();
      process.exit(0);
    } catch (err) {
      process.stdout.write('.');
      await new Promise((res) => setTimeout(res, 2000));
    }
  }

  console.error('\n❌ Timed out waiting for Kafka to become ready.');
  process.exit(1);
}

checkKafka();
