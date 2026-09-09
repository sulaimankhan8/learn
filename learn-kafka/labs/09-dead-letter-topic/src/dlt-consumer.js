import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'lab09-dlt-inspector',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const dltConsumer = kafka.consumer({ groupId: 'dlt-monitoring-group' });

async function run() {
  await dltConsumer.connect();
  await dltConsumer.subscribe({ topic: 'orders.incoming.DLT', fromBeginning: true });

  console.log('🚨 DLT Inspector active. Listening for dead-lettered events...');

  await dltConsumer.run({
    eachMessage: async ({ message }) => {
      const headers = {};
      if (message.headers) {
        for (const [k, v] of Object.entries(message.headers)) {
          headers[k] = v ? v.toString() : '';
        }
      }

      console.log('\n========================================');
      console.log('💀 DEAD LETTER RECORD CAPTURED:');
      console.log(`   Key:               ${message.key?.toString()}`);
      console.log(`   Raw Content:       ${message.value.toString()}`);
      console.log(`   Original Topic:    ${headers['x-original-topic']}`);
      console.log(`   Original Offset:   ${headers['x-original-offset']}`);
      console.log(`   Error:             ${headers['x-error-message']}`);
      console.log(`   Failed At:         ${headers['x-failed-at']}`);
      console.log('========================================');
    }
  });
}

run().catch(console.error);
