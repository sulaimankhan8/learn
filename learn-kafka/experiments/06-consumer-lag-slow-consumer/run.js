import { Kafka } from 'kafkajs';

/**
 * ============================================================================
 * 🔬 EXPERIMENT 06: Slow Downstream Consumer & Lag Measurement
 * ============================================================================
 * 
 * 📌 CONCEPT SUMMARY:
 * -------------------
 * - "Consumer Lag" is the delta between the latest message written to a partition
 *   (Log End Offset / High Watermark / LEO) and the offset the consumer has currently processed.
 *   `Consumer Lag = Log End Offset - Current Consumer Offset`
 * - When a producer publishes faster than a consumer can process (e.g., consumer does heavy
 *   computations, synchronous I/O, or slow external API calls), Lag accumulates in Kafka.
 * - Kafka brokers comfortably buffer gigabytes/terabytes of lag on disk without slowing down producers.
 * 
 * 💡 ARCHITECTURAL TAKEAWAY:
 * --------------------------
 * - Consumer Lag is the SINGLE MOST IMPORTANT metric to monitor in event-driven architectures.
 * - Growing consumer lag is the primary trigger for Horizontal Pod Autoscaling (KEDA / HPA)
 *   in Kubernetes to scale out consumer worker instances!
 * ============================================================================
 */

const kafka = new Kafka({
  clientId: 'exp06-lag',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const admin = kafka.admin();
const producer = kafka.producer();
const topic = `exp06-lag-topic-${Date.now()}`;
const groupId = `exp06-lag-group-${Date.now()}`;
const consumer = kafka.consumer({ groupId });

async function run() {
  console.log('🔬 EXPERIMENT 06: Slow Downstream Consumer & Lag Measurement\n');

  // --------------------------------------------------------------------------
  // Step 1: Create a single-partition topic
  // --------------------------------------------------------------------------
  await admin.connect();
  await admin.createTopics({ topics: [{ topic, numPartitions: 1 }] });

  // --------------------------------------------------------------------------
  // Step 2: Fast Producer blasts 20 messages instantly into Kafka
  // --------------------------------------------------------------------------
  await producer.connect();
  console.log('⚡ Producer blasting 20 messages to Kafka at high speed...');
  const messages = Array.from({ length: 20 }, (_, i) => ({ value: `data-chunk-${i}` }));
  await producer.send({ topic, messages });
  console.log('✅ Producer finished publishing 20 messages.\n');
  await producer.disconnect();

  // --------------------------------------------------------------------------
  // Step 3: Slow Consumer starts processing with simulated downstream delay (200ms)
  // --------------------------------------------------------------------------
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  let processed = 0;
  consumer.run({
    eachMessage: async ({ message }) => {
      processed++;
      
      // Simulate artificial slow downstream work (e.g. database write, PDF generation)
      await new Promise((r) => setTimeout(r, 200));

      // Periodically query the Kafka Admin API to calculate live consumer lag
      if (processed % 5 === 0 || processed === 20) {
        // Fetch current High Watermark (latest written offset) from broker
        const topicOffsets = await admin.fetchTopicOffsets(topic);
        const latestOffset = parseInt(topicOffsets[0].high, 10);
        const currentOffset = parseInt(message.offset, 10) + 1;
        
        // Calculate the lag
        const lag = latestOffset - currentOffset;

        console.log(`📊 [Progress: ${processed}/20] Current Offset: ${currentOffset} | LEO: ${latestOffset} | 🚨 CONSUMER LAG: ${lag} messages`);
      }

      // Once all messages are consumed and lag reaches 0
      if (processed === 20) {
        console.log('\n========================================');
        console.log('🏁 RESULT:');
        console.log('   - Initial Consumer Lag was high (20 messages).');
        console.log('   - As the slow consumer processed items, lag steadily decreased to 0.');
        console.log('   - Kafka buffers unconsumed messages safely on disk without dropping data!');
        console.log('========================================\n');
        
        await consumer.disconnect();
        await admin.disconnect();
        process.exit(0);
      }
    }
  });
}

run().catch(console.error);

