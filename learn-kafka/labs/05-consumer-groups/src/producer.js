import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab05-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const admin = kafka.admin();
const producer = kafka.producer();

async function run() {
  await admin.connect();
  await admin.createTopics({
    topics: [{ topic: 'orders-group-test', numPartitions: 3, replicationFactor: 1 }]
  });
  await admin.disconnect();

  await producer.connect();
  console.log('🚀 Streaming messages every 500ms to orders-group-test (Press Ctrl+C to stop)...');

  let seq = 1;
  while (true) {
    const res = await producer.send({
      topic: 'orders-group-test',
      messages: [{ value: JSON.stringify({ seq, time: new Date().toLocaleTimeString() }) }]
    });
    console.log(`📤 Produced Msg #${seq} to Partition ${res[0].partition}`);
    seq++;
    await new Promise((r) => setTimeout(r, 500));
  }
}

run().catch(console.error);
