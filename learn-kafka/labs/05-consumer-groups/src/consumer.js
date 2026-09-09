import { Kafka } from 'kafkajs';

const workerName = process.argv[2] || `worker-${Math.floor(Math.random() * 1000)}`;

const kafka = new Kafka({
  clientId: workerName,
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'order-scaling-group' });

async function run() {
  await consumer.connect();

  consumer.on(consumer.events.GROUP_JOIN, (e) => {
    const partitions = e.payload.memberAssignment[0]?.partitions || [];
    console.log(`\n🎉 [${workerName}] JOINED GROUP! Assigned Partitions: [${partitions.join(', ')}]`);
  });

  consumer.on(consumer.events.REBALANCING, () => {
    console.log(`\n⚠️ [${workerName}] Group is REBALANCING...`);
  });

  await consumer.subscribe({ topic: 'orders-group-test', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ partition, message }) => {
      const payload = JSON.parse(message.value.toString());
      console.log(`👷 [${workerName}] Processed Msg #${payload.seq} from Partition ${partition}`);
    }
  });
}

process.on('SIGINT', async () => {
  console.log(`\n🛑 [${workerName}] Exiting gracefully...`);
  await consumer.disconnect();
  process.exit(0);
});

run().catch(console.error);
