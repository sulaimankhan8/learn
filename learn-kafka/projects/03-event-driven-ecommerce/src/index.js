import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'ecommerce-platform',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const inventoryConsumer = kafka.consumer({ groupId: 'ecommerce-inventory-group' });
const paymentConsumer = kafka.consumer({ groupId: 'ecommerce-payment-group' });
const notificationConsumer = kafka.consumer({ groupId: 'ecommerce-notification-group' });

async function start() {
  console.log('🛍️ PROJECT 03: Event-Driven E-Commerce Platform Simulation\n');

  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: [
      { topic: 'ecommerce.orders', numPartitions: 2 },
      { topic: 'ecommerce.inventory', numPartitions: 2 },
      { topic: 'ecommerce.payments', numPartitions: 2 }
    ]
  });
  await admin.disconnect();

  await producer.connect();
  await inventoryConsumer.connect();
  await paymentConsumer.connect();
  await notificationConsumer.connect();

  // 1. Inventory Service Subscribes to Orders
  await inventoryConsumer.subscribe({ topic: 'ecommerce.orders', fromBeginning: false });
  inventoryConsumer.run({
    eachMessage: async ({ message }) => {
      const order = JSON.parse(message.value.toString());
      console.log(`📦 [INVENTORY SERVICE] Reserving stock for Order ${order.orderId} (${order.item})`);

      await producer.send({
        topic: 'ecommerce.inventory',
        messages: [{
          key: order.orderId,
          value: JSON.stringify({ orderId: order.orderId, status: 'STOCK_RESERVED', ts: Date.now() })
        }]
      });
    }
  });

  // 2. Payment Service Subscribes to Orders
  await paymentConsumer.subscribe({ topic: 'ecommerce.orders', fromBeginning: false });
  paymentConsumer.run({
    eachMessage: async ({ message }) => {
      const order = JSON.parse(message.value.toString());
      console.log(`💳 [PAYMENT SERVICE] Charging $${order.amount} for Order ${order.orderId}...`);

      await new Promise((r) => setTimeout(r, 100)); // Simulate gateway

      await producer.send({
        topic: 'ecommerce.payments',
        messages: [{
          key: order.orderId,
          value: JSON.stringify({ orderId: order.orderId, amount: order.amount, status: 'PAID', userEmail: order.userEmail })
        }]
      });
    }
  });

  // 3. Notification Service Subscribes to Payments
  await notificationConsumer.subscribe({ topic: 'ecommerce.payments', fromBeginning: false });
  let processedPayments = 0;
  notificationConsumer.run({
    eachMessage: async ({ message }) => {
      processedPayments++;
      const payment = JSON.parse(message.value.toString());
      console.log(`✉️ [NOTIFICATION SERVICE] Sent order confirmation email to ${payment.userEmail} for Order ${payment.orderId}!`);

      if (processedPayments === 3) {
        console.log('\n========================================');
        console.log('🎉 E-Commerce Event Cascade Simulation Completed Successfully!');
        console.log('========================================\n');
        setTimeout(() => process.exit(0), 1000);
      }
    }
  });

  // Wait for consumers to register
  await new Promise((r) => setTimeout(r, 2000));

  // 4. Order Ingestion (Trigger Orders)
  console.log('🚀 Publishing 3 new customer orders...\n');
  const sampleOrders = [
    { orderId: 'ORD-901', userEmail: 'alice@example.com', item: 'MacBook Pro M3', amount: 1999.00 },
    { orderId: 'ORD-902', userEmail: 'bob@example.com', item: 'Sony WH-1000XM5', amount: 399.00 },
    { orderId: 'ORD-903', userEmail: 'charlie@example.com', item: 'Keychron Q1 Pro', amount: 210.00 }
  ];

  for (const order of sampleOrders) {
    await producer.send({
      topic: 'ecommerce.orders',
      messages: [{ key: order.orderId, value: JSON.stringify(order) }]
    });
    await new Promise((r) => setTimeout(r, 300));
  }
}

start().catch(console.error);
