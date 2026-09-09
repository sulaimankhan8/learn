import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab11-tx-client',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer({
  transactionalId: `settlement-tx-${Date.now()}`,
  maxInFlightRequests: 1,
  idempotent: true
});

async function run() {
  await producer.connect();
  console.log('✅ Transactional producer connected with transactionalId');

  // Scenario 1: Successful Atomic Transaction
  console.log('\n--- Scenario 1: Executing Successful Atomic Transaction ---');
  const tx1 = await producer.transaction();
  try {
    console.log('📤 Sending to finance.ledger.v1...');
    await tx1.send({
      topic: 'finance.ledger.v1',
      messages: [{ key: 'ACC-01', value: JSON.stringify({ account: 'ACC-01', debit: 150 }) }]
    });

    console.log('📤 Sending to finance.audit.v1...');
    await tx1.send({
      topic: 'finance.audit.v1',
      messages: [{ key: 'ACC-01', value: JSON.stringify({ action: 'TRANSFER', amount: 150 }) }]
    });

    await tx1.commit();
    console.log('🎉 Transaction 1 COMMITTED successfully! Both records are atomic.');
  } catch (err) {
    await tx1.abort();
    console.error('Tx 1 Aborted:', err);
  }

  // Scenario 2: Aborted Transaction
  console.log('\n--- Scenario 2: Simulating Aborted Transaction ---');
  const tx2 = await producer.transaction();
  try {
    await tx2.send({
      topic: 'finance.ledger.v1',
      messages: [{ key: 'ACC-02', value: JSON.stringify({ account: 'ACC-02', debit: 9999 }) }]
    });

    console.log('⚠️ Simulating critical database failure during transaction...');
    throw new Error('Insufficient Funds Exception!');

    await tx2.commit();
  } catch (err) {
    console.warn(`🛑 Catching error: "${err.message}". Aborting transaction!`);
    await tx2.abort();
    console.log('🛡️ Transaction 2 cleanly ABORTED. Zero records written to committed log.');
  }

  await producer.disconnect();
}

run().catch(console.error);
