const { createClient } = require('redis');

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

// Create separate pub/sub clients
const publisher = createClient({ url: REDIS_URL });
const subscriber = createClient({ url: REDIS_URL });

// Attach error handlers
publisher.on('error', (err) => {
  console.error('🚨 Redis Publisher Error:', err);
});

subscriber.on('error', (err) => {
  console.error('🚨 Redis Subscriber Error:', err);
});

// Initialize both connections
async function initRedis() {
  try {
    if (!publisher.isOpen) await publisher.connect();
    if (!subscriber.isOpen) await subscriber.connect();

    console.log('🔥 Redis Pub/Sub connected successfully');
  } catch (err) {
    console.error('❌ Failed to connect Redis:', err);
  }
}

module.exports = {
  publisher,
  subscriber,
  initRedis,
};
