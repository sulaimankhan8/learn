import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'project01-logger',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'system-metrics-group' });
const topic = 'system.metrics.v1';

const stats = {
  totalProcessed: 0,
  services: {},
  statusCodes: { '200': 0, '404': 0, '500': 0 }
};

async function start() {
  console.log('🌟 PROJECT 01: Simple Event Logger & Metric Tracker\n');

  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({ topics: [{ topic, numPartitions: 1 }] });
  await admin.disconnect();

  await producer.connect();
  await consumer.connect();

  await consumer.subscribe({ topic, fromBeginning: true });

  // Start Consumer Loop
  consumer.run({
    eachMessage: async ({ message }) => {
      const metric = JSON.parse(message.value.toString());
      stats.totalProcessed++;
      stats.services[metric.service] = (stats.services[metric.service] || 0) + 1;
      stats.statusCodes[metric.status] = (stats.statusCodes[metric.status] || 0) + 1;

      console.log(`📊 [${metric.timestamp}] ${metric.service.padEnd(14)} | ${metric.method} ${metric.path} -> ${metric.status} (${metric.latencyMs}ms)`);

      if (stats.totalProcessed === 15) {
        console.log('\n========================================');
        console.log('📈 REAL-TIME METRICS SUMMARY:');
        console.log(`   Total Logs Ingested: ${stats.totalProcessed}`);
        console.log('   By Service:        ', stats.services);
        console.log('   Status Distribution:', stats.statusCodes);
        console.log('========================================\n');
        await consumer.disconnect();
        await producer.disconnect();
        process.exit(0);
      }
    }
  });

  // Produce Sample Stream
  console.log('⚡ Generating log stream...');
  const services = ['auth-service', 'payment-api', 'product-catalog'];
  const paths = ['/login', '/checkout', '/items/42'];
  const statuses = [200, 200, 200, 404, 500];

  for (let i = 1; i <= 15; i++) {
    const payload = {
      id: `log_${i}`,
      service: services[i % services.length],
      path: paths[i % paths.length],
      method: 'POST',
      status: statuses[i % statuses.length],
      latencyMs: Math.floor(Math.random() * 200) + 20,
      timestamp: new Date().toLocaleTimeString()
    };

    await producer.send({
      topic,
      messages: [{ key: payload.service, value: JSON.stringify(payload) }]
    });

    await new Promise((r) => setTimeout(r, 150));
  }
}

start().catch(console.error);
