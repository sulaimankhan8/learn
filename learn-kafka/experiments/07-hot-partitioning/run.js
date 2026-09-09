import { Kafka } from 'kafkajs';

/**
 * ============================================================================
 * 🔬 EXPERIMENT 07: Low-Cardinality Key Skew (Hot Partition Problem)
 * ============================================================================
 * 
 * 📌 CONCEPT SUMMARY:
 * -------------------
 * - Kafka maps a message to a partition using a deterministic hashing algorithm:
 *   `partition = murmur2(key) % numPartitions`
 * - If messages share the SAME key (e.g., key: 'US' for country, or key: 'tenant_default'),
 *   100% of those messages are sent to the EXACT SAME partition.
 * - This creates a "Hot Partition": One broker partition and its assigned consumer
 *   are overwhelmed by traffic, while other partitions sit completely idle.
 * 
 * 💡 ARCHITECTURAL TAKEAWAY:
 * --------------------------
 * - Avoid low-cardinality keys (e.g. gender, country code, boolean flags) as partition keys!
 * - Strategies to prevent Hot Partitions:
 *   1. Use High-Cardinality Keys: `userId`, `orderId`, `uuid`.
 *   2. Key Salting: append a random suffix (e.g., `US_1`, `US_2`, `US_3`) if high traffic per key.
 *   3. Send without key (round-robin) if strict ordering is not required.
 * ============================================================================
 */

const kafka = new Kafka({
  clientId: 'exp07-skew',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const admin = kafka.admin();
const producer = kafka.producer();
const topic = `exp07-skew-topic-${Date.now()}`;

async function run() {
  console.log('🔬 EXPERIMENT 07: Low-Cardinality Key Skew (Hot Partition Problem)\n');

  // --------------------------------------------------------------------------
  // Step 1: Create a 3-partition topic
  // --------------------------------------------------------------------------
  await admin.connect();
  await admin.createTopics({ topics: [{ topic, numPartitions: 3 }] });
  await admin.disconnect();

  await producer.connect();

  // Track the count of messages received by each partition
  const partitionHits = { '0': 0, '1': 0, '2': 0 };

  // --------------------------------------------------------------------------
  // Step 2: Produce 100 messages with severe key skew
  // --------------------------------------------------------------------------
  // 90 messages will use low-cardinality key 'US'
  // 10 messages will use distinct random user IDs
  console.log('📤 Sending 100 messages (90 with key="US", 10 with random user IDs)...');
  for (let i = 1; i <= 100; i++) {
    const key = i <= 90 ? 'US' : `user_${i}_${Date.now()}`;
    const res = await producer.send({
      topic,
      messages: [{ key, value: `payload-${i}` }]
    });

    // Capture which partition the record was sent to
    const p = res[0].partition.toString();
    partitionHits[p] = (partitionHits[p] || 0) + 1;
  }

  // --------------------------------------------------------------------------
  // Step 3: Observe the severe partition load imbalance
  // --------------------------------------------------------------------------
  console.log('\n========================================');
  console.log('📊 FINAL PARTITION TRAFFIC DISTRIBUTION:');
  console.table(partitionHits);
  console.log('🚨 HOT PARTITION DETECTED!');
  console.log('   One broker partition received ~90% of the entire topic traffic.');
  console.log('🏁 LESSON:');
  console.log('   Use high-cardinality entity IDs (e.g. UUID) or Key Salting to distribute load evenly!');
  console.log('========================================\n');

  await producer.disconnect();
}

run().catch(console.error);

