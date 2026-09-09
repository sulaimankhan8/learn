import { Kafka, CompressionTypes } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab12-benchmark',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

async function run() {
  await producer.connect();
  const TOTAL_MESSAGES = 1000;
  const topic = 'perf.benchmark.v1';

  console.log(`🚀 Starting Performance Benchmark (${TOTAL_MESSAGES} messages)...\n`);

  // --- Test 1: Single Send (Uncompressed) ---
  console.log('⏱️  Test 1: Sending single uncompressed messages sequentially...');
  const start1 = Date.now();
  for (let i = 0; i < TOTAL_MESSAGES; i++) {
    await producer.send({
      topic,
      messages: [{ key: `k-${i}`, value: JSON.stringify({ i, payload: 'x'.repeat(256) }) }]
    });
  }
  const time1 = (Date.now() - start1) / 1000;
  const throughput1 = Math.round(TOTAL_MESSAGES / time1);
  console.log(`   ✅ Test 1 Completed in ${time1.toFixed(2)}s (${throughput1} msg/sec)\n`);

  // --- Test 2: Batched Send with GZIP ---
  console.log('⏱️  Test 2: Sending in batches of 200 with GZIP compression...');
  const BATCH_SIZE = 200;
  const start2 = Date.now();
  for (let i = 0; i < TOTAL_MESSAGES; i += BATCH_SIZE) {
    const batch = [];
    for (let j = 0; j < BATCH_SIZE; j++) {
      const idx = i + j;
      batch.push({ key: `k-${idx}`, value: JSON.stringify({ idx, payload: 'x'.repeat(256) }) });
    }
    await producer.send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: batch
    });
  }
  const time2 = (Date.now() - start2) / 1000;
  const throughput2 = Math.round(TOTAL_MESSAGES / time2);
  console.log(`   ✅ Test 2 Completed in ${time2.toFixed(2)}s (${throughput2} msg/sec)\n`);

  // Summary
  const speedup = (time1 / time2).toFixed(1);
  console.log('========================================');
  console.log(`🏁 RESULT: Batched + GZIP was ${speedup}x FASTER than single uncompressed sends!`);
  console.log('========================================');

  await producer.disconnect();
}

run().catch(console.error);
