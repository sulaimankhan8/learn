import { Kafka } from 'kafkajs';

/**
 * ============================================================================
 * 🔬 EXPERIMENT 03: Consumer Group Dynamic Rebalancing Timeline
 * ============================================================================
 * 
 * 📌 CONCEPT SUMMARY:
 * -------------------
 * - In Kafka, multiple consumer instances sharing the same `groupId` form a "Consumer Group".
 * - Partitions of a topic are divided among members of the consumer group so that
 *   each partition is consumed by AT MOST ONE consumer instance at any given time.
 * - When a new consumer joins (or leaves) the group, Kafka triggers a "Group Rebalance".
 * - During a rebalance, the Group Coordinator revokes and reassigns partition ownership
 *   to evenly distribute the workload across all active group members.
 * 
 * 💡 ARCHITECTURAL TAKEAWAY:
 * --------------------------
 * - Max parallelism for a single consumer group is equal to the number of topic partitions.
 * - Having more consumer instances than partitions means the extra consumers sit IDLE.
 * - Dynamic rebalancing allows elastic horizontal auto-scaling in Kubernetes/ECS without downtime!
 * ============================================================================
 */

const kafka = new Kafka({
  clientId: 'exp03-rebalance',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const admin = kafka.admin();
const producer = kafka.producer();
const topic = `exp03-rebalance-topic-${Date.now()}`;
const groupId = `exp03-rebalance-group-${Date.now()}`;

async function run() {
  console.log('🔬 EXPERIMENT 03: Consumer Group Dynamic Rebalancing Timeline\n');

  // --------------------------------------------------------------------------
  // Step 1: Create a Topic with 2 Partitions (P0 and P1)
  // --------------------------------------------------------------------------
  await admin.connect();
  await admin.createTopics({ topics: [{ topic, numPartitions: 2 }] });
  await admin.disconnect();

  // --------------------------------------------------------------------------
  // Step 2: Start Consumer 1 (Only 1 member in group initially)
  // --------------------------------------------------------------------------
  // Consumer 1 will be assigned BOTH Partition 0 and Partition 1 [0, 1].
  console.log('🚀 [T=0s] Starting Consumer 1...');
  const c1 = kafka.consumer({ groupId });
  
  // Listen for KafkaJS group lifecycle events
  c1.on(c1.events.GROUP_JOIN, (e) => {
    console.log(`   🟢 [Consumer 1] Joined! Assigned Partitions:`, e.payload.memberAssignment[0]?.partitions || []);
  });
  c1.on(c1.events.REBALANCING, () => console.log('   ⚠️ [Consumer 1] Notified of Group Rebalance!'));
  
  await c1.connect();
  await c1.subscribe({ topic });
  await c1.run({ eachMessage: async ({ partition }) => console.log(`   [C1] Handled msg from P${partition}`) });

  // --------------------------------------------------------------------------
  // Step 3: Produce continuous stream of messages (1 msg/sec)
  // --------------------------------------------------------------------------
  await producer.connect();
  let msgTimer = setInterval(async () => {
    await producer.send({
      topic,
      messages: [{ value: 'ping' }]
    });
  }, 1000);

  // --------------------------------------------------------------------------
  // Step 4: After 4 seconds, introduce Consumer 2 with the same groupId
  // --------------------------------------------------------------------------
  // Kafka Coordinator detects a new member joining and initiates a rebalance.
  // One of the partitions will be revoked from C1 and assigned to C2 (e.g. C1->P0, C2->P1).
  await new Promise((r) => setTimeout(r, 4000));
  console.log('\n🚀 [T=4s] Starting Consumer 2 (Joining same groupId)...');

  const c2 = kafka.consumer({ groupId });
  c2.on(c2.events.GROUP_JOIN, (e) => {
    console.log(`   🟢 [Consumer 2] Joined! Assigned Partitions:`, e.payload.memberAssignment[0]?.partitions || []);
  });
  c2.on(c2.events.REBALANCING, () => console.log('   ⚠️ [Consumer 2] Notified of Group Rebalance!'));
  
  await c2.connect();
  await c2.subscribe({ topic });
  await c2.run({ eachMessage: async ({ partition }) => console.log(`   [C2] Handled msg from P${partition}`) });

  // --------------------------------------------------------------------------
  // Step 5: Let both consumers operate concurrently for 4 seconds, then clean up
  // --------------------------------------------------------------------------
  await new Promise((r) => setTimeout(r, 4000));
  clearInterval(msgTimer);

  console.log('\n========================================');
  console.log('🏁 RESULT:');
  console.log('   - Consumer 1 originally processed ALL partitions (P0 & P1).');
  console.log('   - When Consumer 2 joined, Kafka automatically rebalanced the group.');
  console.log('   - Each consumer now processes exactly 1 partition concurrently in parallel!');
  console.log('========================================\n');

  await producer.disconnect();
  await c1.disconnect();
  await c2.disconnect();
  process.exit(0);
}

run().catch(console.error);

