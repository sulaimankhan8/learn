import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab08-retry-system',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const mainConsumer = kafka.consumer({ groupId: 'payment-main-group' });
const retryConsumer = kafka.consumer({ groupId: 'payment-retry-group' });

async function run() {
  await producer.connect();
  await mainConsumer.connect();
  await retryConsumer.connect();

  await mainConsumer.subscribe({ topic: 'orders.payment', fromBeginning: true });
  await retryConsumer.subscribe({ topic: 'orders.payment.retry-1', fromBeginning: true });

  // Main Consumer Flow
  mainConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const payload = JSON.parse(message.value.toString());
      console.log(`[MAIN] Processing ${payload.orderId}...`);

      if (payload.flaky) {
        console.warn(`⚠️ [MAIN] Simulated failure for ${payload.orderId}! Forwarding to retry topic...`);
        await producer.send({
          topic: 'orders.payment.retry-1',
          messages: [{
            key: message.key,
            value: message.value,
            headers: { 'x-retry-count': '1', 'x-error': 'ServiceUnavailable' }
          }]
        });
      } else {
        console.log(`✅ [MAIN] Successfully processed ${payload.orderId}`);
      }
    }
  });

  // Retry Consumer Flow (with simulated 2-second delay)
  retryConsumer.run({
    eachMessage: async ({ message }) => {
      const payload = JSON.parse(message.value.toString());
      console.log(`\n🔄 [RETRY-1] Received retry for ${payload.orderId}. Waiting 2s before retry...`);
      await new Promise((r) => setTimeout(r, 2000));

      console.log(`✅ [RETRY-1] Retry succeeded for ${payload.orderId}!`);
    }
  });
}

run().catch(console.error);
