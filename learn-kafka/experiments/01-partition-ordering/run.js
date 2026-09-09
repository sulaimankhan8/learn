import { Kafka } from 'kafkajs';

/**
 * ============================================================================
 * 🔬 EXPERIMENT 01: Global Ordering vs. Partition Ordering Skew
 * ============================================================================
 * 
 * 📌 CONCEPT SUMMARY:
 * -------------------
 * - Kafka guarantees STRICT ORDERING ONLY WITHIN A SINGLE PARTITION (per-partition ordering).
 * - Kafka does NOT guarantee global ordering across multiple partitions in a topic.
 * - When messages are produced WITHOUT a key (unkeyed), Kafka distributes them across
 *   available partitions in a round-robin or sticky batch fashion.
 * - When a consumer consumes from a multi-partition topic, it reads from multiple partitions
 *   concurrently/interleaved. Hence, messages arrive out-of-order relative to the global
 *   production sequence (1 -> 2 -> 3 -> 4 ...).
 * 
 * 💡 ARCHITECTURAL TAKEAWAY:
 * --------------------------
 * If your business logic requires strict sequential processing for a specific entity
 * (e.g. order status transitions, user activity logs), ALWAYS provide a partition KEY
 * (e.g., key: 'order-123' or key: 'user-456'). Messages with the same key always hash
 * to the SAME partition and preserve 100% order!
 * ============================================================================
 */

// 1. Initialize Kafka client pointing to local broker
const kafka = new Kafka({
  clientId: 'exp01-ordering',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const admin = kafka.admin();
const producer = kafka.producer();

// Use unique groupId and topic name per run to avoid state collision from previous runs
const consumer = kafka.consumer({ groupId: `exp01-group-${Date.now()}` });
const topic = `exp01-ordering-${Date.now()}`;

async function run() {
  console.log('🔬 EXPERIMENT 01: Demonstrating Global vs Partition Ordering Skew\n');

  // --------------------------------------------------------------------------
  // Step 1: Create a Topic with 3 Partitions
  // --------------------------------------------------------------------------
  // We explicitly create 3 partitions so that traffic can split across 3 separate queues.
  await admin.connect();
  console.log(`🛠️ Creating topic "${topic}" with 3 partitions...`);
  await admin.createTopics({ topics: [{ topic, numPartitions: 3 }] });
  await admin.disconnect();

  // --------------------------------------------------------------------------
  // Step 2: Produce 15 Unkeyed Sequential Messages (1 to 15)
  // --------------------------------------------------------------------------
  // Notice we omit the `key` field in producer.send().
  // Kafka distributes unkeyed records across Partition 0, 1, and 2.
  await producer.connect();
  console.log('📤 Producing 15 sequential messages (1 to 15) without partition keys...');
  for (let i = 1; i <= 15; i++) {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify({ seq: i, sentAt: Date.now() }) }]
    });
  }
  await producer.disconnect();
  console.log('✅ All 15 messages sent to broker.\n');

  // --------------------------------------------------------------------------
  // Step 3: Consume and Record Arrival Sequence
  // --------------------------------------------------------------------------
  // The consumer subscribes to all 3 partitions from the beginning (offset 0).
  // We record the exact sequence in which messages are received by eachMessage.
  const receivedSequence = [];
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  console.log('📥 Consuming events to inspect arrival order:\n');

  consumer.run({
    eachMessage: async ({ partition, message }) => {
      const data = JSON.parse(message.value.toString());
      receivedSequence.push(data.seq);
      
      // Notice: within each specific partition, offsets increment (0, 1, 2, ...) monotonically.
      console.log(`   [Partition ${partition} @ Offset ${message.offset}] -> Msg Seq #${data.seq}`);

      // Once all 15 messages are received, display the analysis
      if (receivedSequence.length === 15) {
        console.log('\n========================================');
        console.log('📊 EXPERIMENT OBSERVATION:');
        console.log('   Produced Global Order: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]');
        console.log(`   Observed Global Order: [${receivedSequence.join(', ')}]`);
        console.log('🏁 CONCLUSION:');
        console.log('   - Messages within each partition are 100% ordered by offset.');
        console.log('   - Global sequence is INTERLEAVED because partitions are read in parallel batches.');
        console.log('   - Solution: Use message keys (e.g. orderId) to guarantee ordering per entity!');
        console.log('========================================\n');
        await consumer.disconnect();
        process.exit(0);
      }
    }
  });
}

// Global error handler
run().catch(console.error);

