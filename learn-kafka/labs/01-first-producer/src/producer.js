import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab01-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  logLevel: logLevel.INFO
});

const producer = kafka.producer();

async function run() {
  console.log('⏳ Connecting producer to Kafka...');
  await producer.connect();
  console.log('✅ Connected to Kafka broker at localhost:9092');

  const orderEvent = {
    eventId: `evt_${Date.now()}`,
    eventType: 'order.created',
    orderId: 'ORD-1001',
    userId: 'USER-8821',
    amount: 149.99,
    currency: 'USD',
    timestamp: new Date().toISOString()
  };

  console.log('📤 Sending order event:', orderEvent.orderId);

  const recordMetadata = await producer.send({
    topic: 'orders.v1',
    messages: [
      {
        key: orderEvent.orderId,
        value: JSON.stringify(orderEvent),
        headers: {
          'source': 'checkout-service',
          'schema-version': '1.0'
        }
      }
    ]
  });

  console.log('🎉 Message successfully published!');
  console.log(`   Topic:     ${recordMetadata[0].topicName}`);
  console.log(`   Partition: ${recordMetadata[0].partition}`);
  console.log(`   Offset:    ${recordMetadata[0].baseOffset}`);

  await producer.disconnect();
  console.log('🔌 Disconnected producer.');
}

run().catch((err) => {
  console.error('❌ Error running producer:', err);
  process.exit(1);
});
