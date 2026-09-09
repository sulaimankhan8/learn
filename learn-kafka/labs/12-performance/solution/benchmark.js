import { Kafka, CompressionTypes } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'solution12-perf',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

async function run() {
  await producer.connect();
  const payload = 'A'.repeat(1024);
  const messages = Array.from({ length: 500 }, (_, i) => ({ key: `k-${i}`, value: payload }));

  console.log('Sending compressed batch of 500 1KB records...');
  const start = Date.now();
  await producer.send({
    topic: 'perf.benchmark.v1',
    compression: CompressionTypes.GZIP,
    messages
  });
  console.log(`Delivered 500KB in ${Date.now() - start}ms`);

  await producer.disconnect();
}

run().catch(console.error);
