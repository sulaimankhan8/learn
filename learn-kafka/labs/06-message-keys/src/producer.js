import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab06-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const admin = kafka.admin();
const producer = kafka.producer();

async function run() {
  await admin.connect();
  await admin.createTopics({
    topics: [{ topic: 'keyed-user-events.v1', numPartitions: 3, replicationFactor: 1 }]
  });
  await admin.disconnect();

  await producer.connect();

  const events = [
    { key: 'USER-ALPHA', step: 'STEP 1: Registered', ts: 1 },
    { key: 'USER-BETA',  step: 'STEP 1: Registered', ts: 2 },
    { key: 'USER-ALPHA', step: 'STEP 2: Added to Cart', ts: 3 },
    { key: 'USER-BETA',  step: 'STEP 2: Checkout Started', ts: 4 },
    { key: 'USER-ALPHA', step: 'STEP 3: Paid $99', ts: 5 },
    { key: 'USER-BETA',  step: 'STEP 3: Payment Failed', ts: 6 }
  ];

  console.log('📤 Publishing interleaved keyed events...');
  for (const ev of events) {
    const res = await producer.send({
      topic: 'keyed-user-events.v1',
      messages: [{ key: ev.key, value: JSON.stringify(ev) }]
    });
    console.log(`   [${ev.key}] ${ev.step} -> Partition ${res[0].partition} (Offset ${res[0].baseOffset})`);
  }

  await producer.disconnect();
}

run().catch(console.error);
