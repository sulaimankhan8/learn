import express from 'express';
import { Kafka } from 'kafkajs';

const app = express();
app.use(express.json());

const kafka = new Kafka({
  clientId: 'notification-api',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
await producer.connect();
console.log('✅ Connected Kafka Producer in Notification API');

app.post('/notify', async (req, res) => {
  const { userId, title, body } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'userId, title, and body are required' });
  }

  const notificationEvent = {
    notificationId: `notif_${Date.now()}`,
    userId,
    title,
    body,
    timestamp: new Date().toISOString()
  };

  try {
    const meta = await producer.send({
      topic: 'notifications.broadcast.v1',
      messages: [
        {
          key: userId,
          value: JSON.stringify(notificationEvent),
          headers: { 'event-type': 'USER_NOTIFICATION' }
        }
      ]
    });

    return res.status(202).json({
      status: 'ACCEPTED',
      notificationId: notificationEvent.notificationId,
      partition: meta[0].partition,
      offset: meta[0].baseOffset
    });
  } catch (err) {
    console.error('Failed to publish notification:', err);
    return res.status(500).json({ error: 'Failed to enqueue notification' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Notification API listening on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/notify with JSON payload`);
});
