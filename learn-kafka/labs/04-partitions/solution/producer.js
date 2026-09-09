import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'solution04-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

async function run() {
  await producer.connect();
  const distribution = { '0': 0, '1': 0, '2': 0 };

  for (let i = 0; i < 60; i++) {
    const res = await producer.send({
      topic: 'multi-partition.v1',
      messages: [{ value: JSON.stringify({ seq: i }) }]
    });
    const p = res[0].partition.toString();
    distribution[p] = (distribution[p] || 0) + 1;
  }

  console.log('📊 Final Partition Distribution:');
  console.table(distribution);

  await producer.disconnect();
}

run().catch(console.error);
