const WebSocket = require('ws');
const { pubClient, subClient } = require('../config/redis');
const { setupWebSocketHandlers } = require('../websocket/handlers');

let wssInstance = null;

// Initialize WebSocket server + Redis Subscriber
const initWebSocket = async (server) => {
  wssInstance = new WebSocket.Server({ server });

  // Subscribe to Redis channel for match updates
  await subClient.subscribe('match-updates', (raw) => {
    try {
      const payload = JSON.parse(raw);
      broadcast(payload);
    } catch (err) {
      console.error('❌ Failed to parse Redis message:', err);
    }
  });

  console.log('📡 WS Ready: Listening to Redis channel "match-updates"');

  // New WebSocket connections
  wssInstance.on('connection', (socket) => {
    console.log('🔗 New WebSocket Client Connected');

    socket.isAlive = true;
    socket.on('pong', () => (socket.isAlive = true));

    // Attach legacy handler support
    setupWebSocketHandlers(socket);
  });

  startHeartbeat();
};

// Heartbeat to clean up dead WebSocket clients
const startHeartbeat = () => {
  setInterval(() => {
    wssInstance.clients.forEach((client) => {
      if (!client.isAlive) {
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);
};

// Broadcast message to all connected WebSocket clients
const broadcast = (data) => {
  if (!wssInstance) return;

  const message = JSON.stringify({
    type: 'game_update',
    data
  });

  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Publish updates to Redis channel (backend-to-backend)
const publishMatchUpdate = async (update) => {
  if (!pubClient.isOpen) return;

  await pubClient.publish('match-updates', JSON.stringify(update));
};

module.exports = {
  initWebSocket,
  publishMatchUpdate
};
