import { Kafka } from 'kafkajs';

/**
 * ============================================================================
 * 🔬 EXPERIMENT 05: Transient Error Retry Pipeline (Retry Topic Pattern)
 * ============================================================================
 * 
 * 📌 CONCEPT SUMMARY:
 * -------------------
 * - When a consumer fails to process a message due to a transient downstream error
 *   (e.g., 3rd-party HTTP 503, database lock timeout, network glitch), blocking the
 *   consumer thread with `sleep()` creates head-of-line blocking for that entire partition.
 * - Enterprise Best Practice: "Retry Topic Pattern"
 *   Instead of holding up partition consumption, the failing message is forwarded to a
 *   dedicated retry topic (e.g., `orders.retry-1`, `orders.retry-2`) with an incremented
 *   retry count in its headers.
 * - When max attempts are exceeded, the message is routed to a Dead Letter Queue (DLQ).
 * 
 * 💡 ARCHITECTURAL TAKEAWAY:
 * --------------------------
 * - Decoupling failed records to separate retry topics keeps the main consumer loop
 *   operating at full throughput for healthy messages while giving transient issues time to recover.
 * ============================================================================
 */

const kafka = new Kafka({
  clientId: 'exp05-retries',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: `exp05-group-${Date.now()}` });
const topic = `exp05-topic-${Date.now()}`;

// Attempt counter to simulate transient failure recovery on attempt #3
let attempts = 0;

async function run() {
  console.log('🔬 EXPERIMENT 05: Transient Error Retry Pipeline\n');

  await producer.connect();
  await consumer.connect();

  // --------------------------------------------------------------------------
  // Step 1: Subscribe to BOTH the Primary Topic and the Retry Topic
  // --------------------------------------------------------------------------
  await consumer.subscribe({ topic, fromBeginning: true });
  await consumer.subscribe({ topic: `${topic}.retry-1`, fromBeginning: true });

  // --------------------------------------------------------------------------
  // Step 2: Produce an Event that will trigger transient failures
  // --------------------------------------------------------------------------
  console.log('📤 Publishing initial job: "JOB-909" to primary topic...');
  await producer.send({
    topic,
    messages: [{ key: 'FLAKY-JOB', value: JSON.stringify({ jobId: 'JOB-909', type: 'DATA_SYNC' }) }]
  });

  // --------------------------------------------------------------------------
  // Step 3: Consumer processing loop with Retry Routing logic
  // --------------------------------------------------------------------------
  consumer.run({
    eachMessage: async ({ topic: currentTopic, message }) => {
      attempts++;
      console.log(`📥 Received on [${currentTopic}] (Attempt #${attempts})`);

      // Simulate failure on attempts 1 and 2, but success on attempt 3
      if (attempts < 3) {
        console.warn(`   ❌ Simulated API Timeout on attempt ${attempts}! Re-routing message to retry topic...`);
        
        // Forward message to retry topic with updated tracking header
        await producer.send({
          topic: `${topic}.retry-1`,
          messages: [{
            key: message.key,
            value: message.value,
            headers: { 'x-retry-attempt': attempts.toString() }
          }]
        });
      } else {
        // Attempt 3 succeeds
        console.log('   🎉 Attempt #3 SUCCEEDED! Job processed cleanly.');
        console.log('\n========================================');
        console.log('🏁 RESULT:');
        console.log('   - Transient failures on attempt #1 and #2 were routed to a retry topic.');
        console.log('   - On attempt #3, processing succeeded without blocking the main topic queue!');
        console.log('========================================\n');
        
        await consumer.disconnect();
        await producer.disconnect();
        process.exit(0);
      }
    }
  });
}

run().catch(console.error);

