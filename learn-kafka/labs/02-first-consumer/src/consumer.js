import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab02-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  logLevel: logLevel.INFO
});

const consumer = kafka.consumer({
  groupId: 'order-logger-group'
});

async function run() {
  console.log('⏳ Connecting consumer to Kafka...');
  await consumer.connect();
  console.log('✅ Consumer connected to group: order-logger-group');

  await consumer.subscribe({
    topic: 'orders.v1',
    fromBeginning: true
  });

  console.log('👂 Subscribed to orders.v1. Listening for messages (Press Ctrl+C to exit)...');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const key = message.key ? message.key.toString() : 'null';
      const rawValue = message.value.toString();
      let event;
      try {
        event = JSON.parse(rawValue);
      } catch (err) {
        console.error('❌ Failed to parse JSON:', rawValue);
        return;
      }

      const headers = {};
      if (message.headers) {
        for (const [k, v] of Object.entries(message.headers)) {
          headers[k] = v ? v.toString() : '';
        }
      }

      console.log('\n----------------------------------------');
      console.log(`📥 [Partition ${partition} | Offset ${message.offset}]`);
      console.log(`   Key:       ${key}`);
      console.log(`   Event ID:  ${event.eventId || 'N/A'}`);
      console.log(`   Order ID:  ${event.orderId}`);
      console.log(`   User:      ${event.userId}`);
      console.log(`   Amount:    $${event.amount}`);
      console.log(`   Headers:  `, headers);
      console.log('----------------------------------------');
    }
  });
}

// Handle graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Disconnecting consumer...');
  await consumer.disconnect();
  console.log('🔌 Disconnected cleanly.');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

run().catch((err) => {
  console.error('❌ Consumer error:', err);
  process.exit(1);
});
