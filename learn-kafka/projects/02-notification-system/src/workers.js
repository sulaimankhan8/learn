import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'notification-workers-host',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const topic = 'notifications.broadcast.v1';

async function startWorker(channelName, groupId, colorEmoji) {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  console.log(`${colorEmoji} [${channelName.toUpperCase()} WORKER] Subscribed on group: ${groupId}`);

  consumer.run({
    eachMessage: async ({ message }) => {
      const payload = JSON.parse(message.value.toString());
      console.log(`\n${colorEmoji} [${channelName.toUpperCase()}] Delivering to ${payload.userId}:`);
      console.log(`   Title:   "${payload.title}"`);
      console.log(`   Message: "${payload.body}"`);
      console.log(`   Timestamp: ${payload.timestamp}`);
    }
  });
}

async function run() {
  console.log('🌟 Starting Multi-Channel Notification Workers...\n');
  await startWorker('email-service', 'email-delivery-group', '📧');
  await startWorker('sms-service',   'sms-delivery-group',   '📱');
  await startWorker('push-service',  'push-delivery-group',  '🔔');
  console.log('\n✅ All 3 channel workers are listening! Send POST requests to http://localhost:3000/notify');
}

run().catch(console.error);
