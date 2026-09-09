const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/shop';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

app.use(cors());
app.use(express.json());

// MongoDB Schema
const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Item = mongoose.model('Item', ItemSchema);

// Redis Client
const redis = new Redis(REDIS_URL, {
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  }
});

redis.on('connect', () => console.log('✅ Connected to Redis cache'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB persistence layer'))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

// Healthcheck Route for Docker Engine
app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  const redisStatus = redis.status === 'ready' ? 'UP' : 'DOWN';
  const isHealthy = mongoStatus === 'UP' && redisStatus === 'UP';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus,
      redis: redisStatus
    }
  });
});

// REST API Endpoints
app.get('/api/items', async (req, res) => {
  try {
    const cached = await redis.get('items:all');
    if (cached) {
      return res.json({ source: 'redis-cache', data: JSON.parse(cached) });
    }
    const items = await Item.find().sort({ createdAt: -1 }).limit(20);
    await redis.set('items:all', JSON.stringify(items), 'EX', 60);
    res.json({ source: 'mongodb', data: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const { name, price } = req.body;
    const item = new Item({ name, price });
    await item.save();
    await redis.del('items:all'); // Invalidate cache
    res.status(201).json({ message: 'Item created', item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production Backend API listening on port ${PORT}`);
});

// Graceful Shutdown on SIGTERM / SIGINT
const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('🔒 HTTP Server closed.');
    try {
      await mongoose.connection.close(false);
      console.log('🔒 MongoDB connection closed.');
      await redis.quit();
      console.log('🔒 Redis connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('⚠️ Force shutdown timeout exceeded. Exiting.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
