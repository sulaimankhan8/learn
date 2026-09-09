import { Kafka } from 'kafkajs';

/**
 * ============================================================================
 * 🔬 EXPERIMENT 02: Consumer Sudden Crash & Resume (Fault Tolerance)
 * ============================================================================
 * 
 * 📌 CONCEPT SUMMARY:
 * -------------------
 * - Kafka tracks message consumption progress through "Consumer Offsets".
 * - When a consumer successfully finishes processing a message, it commits the
 *   next offset (offset + 1) to Kafka's internal `__consumer_offsets` topic.
 * - If a consumer process crashes unexpectedly (e.g. OOM, node reboot, uncaught error),
 *   a replacement consumer joining the SAME `groupId` asks Kafka for the last committed
 *   offset and resumes execution exactly from that checkpoint without missing messages.
 * 
 * 💡 ARCHITECTURAL TAKEAWAY:
 * --------------------------
 * - Setting `autoCommit: false` gives fine-grained control over when an offset is saved.
 * - Always commit offsets AFTER business logic execution has safely persisted data
 *   to avoid "phantom commits" (where an offset is saved but the task crashed mid-way).
 * ============================================================================
 */

const kafka = new Kafka({
  clientId: 'exp02-client',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const groupId = `exp02-resilient-group-${Date.now()}`;
const topic = `exp02-crash-test-${Date.now()}`;

async function run() {
  console.log('🔬 EXPERIMENT 02: Consumer Sudden Crash & Resume\n');

  // --------------------------------------------------------------------------
  // Step 1: Seed 8 Records to Kafka
  // --------------------------------------------------------------------------
  await producer.connect();
  for (let i = 1; i <= 8; i++) {
    await producer.send({
      topic,
      messages: [{ key: `item-${i}`, value: JSON.stringify({ item: i, desc: `Task #${i}` }) }]
    });
  }
  console.log('✅ Produced 8 tasks to topic:', topic);
  await producer.disconnect();

  // --------------------------------------------------------------------------
  // Step 2: Consumer Instance 1 Processes 3 Messages and Crashes
  // --------------------------------------------------------------------------
  console.log('\n🚀 Starting Consumer Instance 1 (Will crash after 3 messages)...');
  const c1 = kafka.consumer({ groupId });
  await c1.connect();
  await c1.subscribe({ topic, fromBeginning: true });

  let count = 0;
  await new Promise((resolve) => {
    c1.run({
      // Disable autoCommit so we manually govern exact offset checkpointing
      autoCommit: false,
      eachMessage: async ({ topic, partition, message }) => {
        count++;
        console.log(`   [C1] Processed Task #${count} (Offset ${message.offset})`);

        // Explicit manual commit: next expected offset is message.offset + 1
        await c1.commitOffsets([{ topic, partition, offset: (BigInt(message.offset) + 1n).toString() }]);

        // Simulate abrupt failure after 3 successful processing cycles
        if (count === 3) {
          console.warn('   💥 Simulating unexpected container crash on Consumer 1!');
          // Disconnect abruptly without processing tasks 4 to 8
          await c1.disconnect();
          resolve();
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // Step 3: Wait briefly for cluster state stabilization
  // --------------------------------------------------------------------------
  console.log('\n⏳ Waiting 2 seconds for cluster to register consumer disconnect...\n');
  await new Promise((r) => setTimeout(r, 2000));

  // --------------------------------------------------------------------------
  // Step 4: Replacement Consumer Instance 2 joins under the same groupId
  // --------------------------------------------------------------------------
  // Since Consumer 1 committed offset 3 (meaning 0, 1, 2 were completed),
  // Consumer 2 automatically starts fetching from offset 3 (Task #4).
  console.log('🚀 Starting Replacement Consumer Instance 2...');
  const c2 = kafka.consumer({ groupId });
  await c2.connect();
  await c2.subscribe({ topic }); // No fromBeginning needed: resumes from committed offset

  let c2Count = 0;
  c2.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      c2Count++;
      const payload = JSON.parse(message.value.toString());
      console.log(`   [C2 RESUMED] Processed Task: ${payload.desc} (Offset ${message.offset})`);
      
      // Commit each offset as C2 works through the remaining tasks
      await c2.commitOffsets([{ topic, partition, offset: (BigInt(message.offset) + 1n).toString() }]);

      if (payload.item === 8) {
        console.log('\n========================================');
        console.log('🎉 RESULT:');
        console.log('   Consumer 2 successfully resumed from Offset 3 and completed remaining tasks!');
        console.log('   Zero messages were lost despite the crash of Consumer 1.');
        console.log('========================================\n');
        await c2.disconnect();
        process.exit(0);
      }
    }
  });
}

run().catch(console.error);

