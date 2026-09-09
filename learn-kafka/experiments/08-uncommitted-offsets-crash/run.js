import { Kafka } from 'kafkajs';

/**
 * ============================================================================
 * 🔬 EXPERIMENT 08: Uncommitted Offsets Crash & Complete Replay
 * ============================================================================
 * 
 * 📌 CONCEPT SUMMARY:
 * -------------------
 * - Kafka decouples message storage from consumer consumption state.
 * - Messages remain permanently in Kafka's append-only log until the retention period expires,
 *   regardless of how many times they are read.
 * - If a consumer reads N messages with `autoCommit: false` and exits/crashes without
 *   ever calling `commitOffsets()`, Kafka retains the initial offset checkpoint (Offset 0).
 * - When any consumer later starts up with the same `groupId`, Kafka replays ALL N uncommitted
 *   messages from the beginning of that uncommitted range!
 * 
 * 💡 ARCHITECTURAL TAKEAWAY:
 * --------------------------
 * - Kafka enables deterministic message replay for disaster recovery, bug back-fills,
 *   or machine learning re-training by simply rewinding committed offsets!
 * ============================================================================
 */

const kafka = new Kafka({
  clientId: 'exp08-uncommitted',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const topic = `exp08-topic-${Date.now()}`;
const groupId = `exp08-group-${Date.now()}`;

async function run() {
  console.log('🔬 EXPERIMENT 08: Uncommitted Offsets Crash & Complete Replay\n');

  // --------------------------------------------------------------------------
  // Step 1: Produce 5 Sequential Messages
  // --------------------------------------------------------------------------
  await producer.connect();
  const msgs = [1, 2, 3, 4, 5].map((i) => ({ value: `Task #${i}` }));
  await producer.send({ topic, messages: msgs });
  await producer.disconnect();
  console.log('✅ Produced 5 tasks to topic:', topic);

  // --------------------------------------------------------------------------
  // Step 2: Phase 1 — Consumer reads all 5 items but intentionally NEVER commits
  // --------------------------------------------------------------------------
  console.log('\n🚀 Phase 1: Consumer reads 5 messages with autoCommit: false and NO manual commit...');
  const c1 = kafka.consumer({ groupId });
  await c1.connect();
  await c1.subscribe({ topic, fromBeginning: true });

  let count1 = 0;
  await new Promise((resolve) => {
    c1.run({
      autoCommit: false,
      eachMessage: async ({ message }) => {
        count1++;
        console.log(`   [Phase 1] Processed ${message.value.toString()} without committing!`);
        
        // When all 5 messages are processed, crash/disconnect without saving progress
        if (count1 === 5) {
          console.log('   💥 Terminating Consumer 1 without committing any offset...');
          await c1.disconnect();
          resolve();
        }
      }
    });
  });

  // Wait 2 seconds for cluster registration
  await new Promise((r) => setTimeout(r, 2000));

  // --------------------------------------------------------------------------
  // Step 3: Phase 2 — Restart Consumer under identical groupId
  // --------------------------------------------------------------------------
  // Because no offset commit was ever stored in __consumer_offsets,
  // Kafka starts delivering from Offset 0 again, giving a 100% complete replay!
  console.log('\n🚀 Phase 2: Restarting Consumer under same groupId (replaying uncommitted log)...');
  const c2 = kafka.consumer({ groupId });
  await c2.connect();
  await c2.subscribe({ topic });

  let count2 = 0;
  c2.run({
    autoCommit: false,
    eachMessage: async ({ message }) => {
      count2++;
      console.log(`   [Phase 2 REPLAY] Re-received ${message.value.toString()} (Offset ${message.offset})`);

      if (count2 === 5) {
        console.log('\n========================================');
        console.log('🏁 RESULT:');
        console.log('   - All 5 uncommitted messages were successfully re-delivered!');
        console.log('   - Demonstrates Kafka log immutability and replayability.');
        console.log('========================================\n');
        await c2.disconnect();
        process.exit(0);
      }
    }
  });
}

run().catch(console.error);

