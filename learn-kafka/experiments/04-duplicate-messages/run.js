import { Kafka } from 'kafkajs';

/**
 * ============================================================================
 * 🔬 EXPERIMENT 04: Crash Before Commit (Duplicate Processing Demonstration)
 * ============================================================================
 * 
 * 📌 CONCEPT SUMMARY:
 * -------------------
 * - Kafka guarantees "At-Least-Once" message delivery by default.
 * - If a consumer finishes the business logic (e.g. charging a credit card, updating
 *   a database, calling a 3rd party webhook) but crashes BEFORE it can commit its offset
 *   back to Kafka, Kafka assumes the message was NEVER processed.
 * - When the consumer recovers and restarts, it will fetch and re-process the exact
 *   same message a second time — leading to a DUPLICATE action (e.g. Double Charge!).
 * 
 * 💡 ARCHITECTURAL TAKEAWAY:
 * --------------------------
 * - Message processing in distributed systems MUST BE IDEMPOTENT.
 * - Solution Patterns:
 *   1. Idempotency Key / Deduplication Table (e.g. store processed `orderId` in DB with unique constraint).
 *   2. Transactional Outbox Pattern.
 *   3. Exactly-Once Semantics (EOS) using Kafka Transactions (`read-process-write`).
 * ============================================================================
 */

const kafka = new Kafka({
  clientId: 'exp04-client',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const topic = `exp04-dup-topic-${Date.now()}`;
const groupId = `exp04-dup-group-${Date.now()}`;

// Global business state tracker (simulating external database / payment processor balance)
let totalBilledDollars = 0;

async function run() {
  console.log('🔬 EXPERIMENT 04: Crash Before Commit (Duplicate Processing Demonstration)\n');

  // --------------------------------------------------------------------------
  // Step 1: Produce 1 Payment Charge Event
  // --------------------------------------------------------------------------
  await producer.connect();
  console.log('📤 Producing 1 billing event: Order "ORDER-100" for $100...');
  await producer.send({
    topic,
    messages: [{ key: 'ORDER-100', value: JSON.stringify({ orderId: 'ORDER-100', amount: 100 }) }]
  });
  await producer.disconnect();

  // --------------------------------------------------------------------------
  // Step 2: Attempt 1 — Consumer executes payment but crashes before offset commit
  // --------------------------------------------------------------------------
  console.log('\n🚀 Attempt 1: Consumer processes payment but crashes BEFORE offset commit...');
  const c1 = kafka.consumer({ groupId });
  await c1.connect();
  await c1.subscribe({ topic, fromBeginning: true });

  await new Promise((resolve) => {
    c1.run({
      autoCommit: false, // Disabling autoCommit to control exact commit timing
      eachMessage: async ({ message }) => {
        const order = JSON.parse(message.value.toString());
        
        // 1. Business Logic Execution (Non-idempotent side effect)
        totalBilledDollars += order.amount;
        console.log(`   💳 Charged $${order.amount} for ${order.orderId}! (Total Billed: $${totalBilledDollars})`);
        
        // 2. Sudden crash BEFORE c1.commitOffsets() is reached
        console.log('   💥 CRASH! Power outage before commitOffsets() could be executed...');
        await c1.disconnect();
        resolve();
      }
    });
  });

  // Wait 2 seconds simulating container restart
  await new Promise((r) => setTimeout(r, 2000));

  // --------------------------------------------------------------------------
  // Step 3: Attempt 2 — Consumer restarts and reconnects to Kafka
  // --------------------------------------------------------------------------
  // Because the offset was never committed, Kafka sends the exact same message again!
  console.log('\n🚀 Attempt 2: Consumer restarts and reconnects to Kafka...');
  const c2 = kafka.consumer({ groupId });
  await c2.connect();
  await c2.subscribe({ topic });

  c2.run({
    autoCommit: false,
    eachMessage: async ({ message }) => {
      const order = JSON.parse(message.value.toString());
      
      // The restarted consumer re-executes the side-effect without knowing it ran before
      totalBilledDollars += order.amount;
      console.log(`   💳 Charged $${order.amount} for ${order.orderId} AGAIN! (Total Billed: $${totalBilledDollars})`);

      console.log('\n========================================');
      console.log('🚨 EXPERIMENT OBSERVATION:');
      console.log(`   Customer was charged TWICE ($${totalBilledDollars} total) because offset was not committed!`);
      console.log('🏁 SOLUTION:');
      console.log('   - Always implement Idempotent Consumers (use deduplication IDs in database).');
      console.log('   - Or use transactional commits to tie database writes and offset commits together.');
      console.log('========================================\n');

      await c2.disconnect();
      process.exit(0);
    }
  });
}

run().catch(console.error);

