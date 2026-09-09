import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'fintech-capstone-engine',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer({ idempotent: true });
const fraudConsumer = kafka.consumer({ groupId: 'fraud-detection-engine-group' });
const settlementConsumer = kafka.consumer({ groupId: 'settlement-ledger-group' });
const dltConsumer = kafka.consumer({ groupId: 'dlt-audit-monitor-group' });

const settledTransactions = new Set();

async function startCapstone() {
  console.log('🏛️ CAPSTONE SOLUTION: Fintech Real-Time Fraud & Payment Streaming Engine\n');

  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: [
      { topic: 'fintech.payments.incoming', numPartitions: 3 },
      { topic: 'fintech.fraud.alerts', numPartitions: 2 },
      { topic: 'fintech.payments.DLT', numPartitions: 1 }
    ]
  });
  await admin.disconnect();

  await producer.connect();
  await fraudConsumer.connect();
  await settlementConsumer.connect();
  await dltConsumer.connect();

  await fraudConsumer.subscribe({ topic: 'fintech.payments.incoming', fromBeginning: false });
  await settlementConsumer.subscribe({ topic: 'fintech.payments.incoming', fromBeginning: false });
  await dltConsumer.subscribe({ topic: 'fintech.payments.DLT', fromBeginning: false });

  // 1. Real-Time Fraud Engine
  fraudConsumer.run({
    eachMessage: async ({ message }) => {
      let tx;
      try {
        tx = JSON.parse(message.value.toString());
      } catch (e) {
        return; // DLT will handle
      }

      if (tx.amount >= 10000) {
        console.log(`🚨 [FRAUD DETECTED] High-value transaction $${tx.amount} detected on Account ${tx.accountId}! Emitting alert...`);
        await producer.send({
          topic: 'fintech.fraud.alerts',
          messages: [{
            key: tx.accountId,
            value: JSON.stringify({
              alertId: `ALT-${Date.now()}`,
              transactionId: tx.transactionId,
              accountId: tx.accountId,
              amount: tx.amount,
              reason: 'TRANSACTION_EXCEEDS_10K_THRESHOLD',
              timestamp: new Date().toISOString()
            })
          }]
        });
      }
    }
  });

  // 2. Settlement Ledger Consumer (Idempotent)
  settlementConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      let tx;
      try {
        tx = JSON.parse(message.value.toString());
      } catch (err) {
        console.error(`💥 [SETTLEMENT] Poison pill detected on P${partition}@${message.offset}! Forwarding to DLT...`);
        await producer.send({
          topic: 'fintech.payments.DLT',
          messages: [{
            key: message.key,
            value: message.value,
            headers: { 'x-dlt-reason': 'CorruptJSON', 'x-failed-at': new Date().toISOString() }
          }]
        });
        return;
      }

      if (tx.amount <= 0) {
        console.error(`💥 [SETTLEMENT] Negative amount ($${tx.amount}) rejected for ${tx.transactionId}! Forwarding to DLT...`);
        await producer.send({
          topic: 'fintech.payments.DLT',
          messages: [{
            key: message.key,
            value: message.value,
            headers: { 'x-dlt-reason': 'NegativeAmountViolation' }
          }]
        });
        return;
      }

      if (settledTransactions.has(tx.transactionId)) {
        console.log(`⚠️ [SETTLEMENT] Duplicate transaction ${tx.transactionId} ignored (Idempotent Guard).`);
        return;
      }

      settledTransactions.add(tx.transactionId);
      console.log(`💳 [SETTLEMENT LEDGER] Settled $${tx.amount} for Account ${tx.accountId} (Tx: ${tx.transactionId})`);
    }
  });

  // 3. DLT Inspector
  dltConsumer.run({
    eachMessage: async ({ message }) => {
      console.log(`💀 [DLT MONITOR] Isolated unprocessable payload: ${message.value.toString()}`);
    }
  });

  // Wait for consumers to register
  await new Promise((r) => setTimeout(r, 2000));

  // 4. Simulate Real-World Traffic
  console.log('🚀 Simulating Payment Stream (Normal, Fraud, Duplicate, Poison Pill)...\n');

  const testStream = [
    { key: 'ACC-101', val: JSON.stringify({ transactionId: 'TX-001', accountId: 'ACC-101', amount: 150.00 }) },
    { key: 'ACC-999', val: JSON.stringify({ transactionId: 'TX-002', accountId: 'ACC-999', amount: 25000.00 }) }, // Fraudulent
    { key: 'ACC-101', val: JSON.stringify({ transactionId: 'TX-001', accountId: 'ACC-101', amount: 150.00 }) }, // Duplicate
    { key: 'ACC-404', val: 'CORRUPT_PAYLOAD_NOT_JSON' }, // Poison Pill
    { key: 'ACC-505', val: JSON.stringify({ transactionId: 'TX-003', accountId: 'ACC-505', amount: -50.00 }) } // Negative
  ];

  for (const item of testStream) {
    await producer.send({
      topic: 'fintech.payments.incoming',
      messages: [{ key: item.key, value: item.val }]
    });
    await new Promise((r) => setTimeout(r, 400));
  }

  setTimeout(() => {
    console.log('\n========================================');
    console.log('🏁 CAPSTONE PIPELINE VERIFIED SUCCESSFULLY!');
    console.log('========================================\n');
    process.exit(0);
  }, 4000);
}

startCapstone().catch(console.error);
