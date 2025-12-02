const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { WebSocketServer, WebSocket } = require('ws'); 
const dotenv = require('dotenv');

// --- Import Routes ---
const gamingRoutes = require('./routes/gaming.js');
const defiRoutes = require('./routes/defi.js');
const nftRoutes = require('./routes/nft.js');
const launchpadRoutes = require('./routes/launchpad.js');
const governanceRoutes = require('./routes/governance.js');
const userRoutes = require('./routes/user.js');
const analyticsRoutes = require('./routes/analytics.js');
const matchRoutes = require('./routes/matches.js'); 

// --- Central Live Match Data Store ---
let matches = {}; 

// Import mock data and utility - Corrected import to use getTransactions
const { initializeMockData, getTransactions } = require('./data/mockData.js'); 

// --- Apollo GraphQL ---
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const typeDefs = require('./graphql/typeDefs.js');
const resolvers = require('./graphql/resolvers.js');

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

// --- Security Middleware ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// --- Body Parsing & Compression ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(morgan('combined'));

// --- Health Check Endpoint ---
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Updates the centralized match data and broadcasts the change to subscribed WebSocket clients.
 * @param {string} matchId The ID of the match to update.
 * @param {object} update The partial update object (e.g., { score: 10 }).
 */
function broadcastMatchUpdate(matchId, update) {
  // 1. Update the centralized match data (safely merge)
  matches[matchId] = { ...(matches[matchId] || {}), ...update };

  // 2. Broadcast the update to all subscribed clients
  const updatePayload = JSON.stringify({ 
        matchId, 
        data: matches[matchId],
        type: 'MATCH_UPDATE' 
    });

  wss.clients.forEach(client => {
    // Check if the client is OPEN and is subscribed to the specific matchId
    if (client.readyState === WebSocket.OPEN && client.subscribedMatch === matchId) {
      client.send(updatePayload);
    }
  });
}

// --- WebSocket Connection Handling ---
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Handle messages from clients (Subscription requests)
  ws.on('message', (message) => {
    try {
      const { action, matchId } = JSON.parse(message);

      if (action === 'subscribe' && matchId) {
        ws.subscribedMatch = matchId;
        console.log(`Client subscribed to ${matchId}`);
        // Send current state immediately upon subscription
        ws.send(JSON.stringify({ matchId, data: matches[matchId] || {}, type: 'INITIAL_STATE' }));
      } else if (action === 'unsubscribe') {
        ws.subscribedMatch = null;
        console.log(`Client unsubscribed`);
      }
    } catch (err) {
      console.error('Invalid WebSocket message format:', err.message);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// --- REST Endpoint to Manually Update Match ---
app.post('/update-match/:matchId', (req, res) => {
  const { matchId } = req.params;
  const update = req.body;
  
  if (!matches[matchId]) {
    return res.status(404).json({ success: false, error: 'Match ID not found.' });
  }
  
  broadcastMatchUpdate(matchId, update);
  res.json({ success: true, matchId, data: matches[matchId] });
});

// --- Simulate Live Match Updates ---
function startMatchSimulation() {
  console.log('Starting live match simulation...');
  
  // Use 'tx_001', which is a valid game_reward transaction ID in your mock data
  const matchId = 'tx_001'; 
    
    // Ensure the simulation only runs if the initial match state exists
    if (!matches[matchId]) {
        console.error(`Simulation failed: Match ID '${matchId}' not found after initialization.`);
        return;
    }

    // Interval to simulate score updates every 5 seconds
    setInterval(() => {
      // Example update: Incrementing a score property
      const currentScore = (matches[matchId] && matches[matchId].score) || 0;
      const scoreUpdate = { score: currentScore + 1 }; 
      console.log(`Simulating update for ${matchId}: score=${currentScore + 1}`);
      broadcastMatchUpdate(matchId, scoreUpdate);
    }, 5000);
}


// --- Start Server Function ---
async function startServer() {

    // 1. INITIALIZE MOCK DATA
    initializeMockData();
    
    // Populate the live 'matches' store by filtering the mock transactions that are 'game_reward' types
    getTransactions()
        .filter(tx => tx.type === 'game_reward')
        .forEach(matchTransaction => {
            // Use the transaction ID as the match ID for the live store
            matches[matchTransaction.id] = {
                score: matchTransaction.metadata.score || 0, 
                gameId: matchTransaction.gameId,
                userId: matchTransaction.userId,
                ...matchTransaction.metadata 
            };
        });

  // 2. APOLLO GRAPHQL SERVER
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apolloServer.start();

  app.use('/graphql', express.json(), expressMiddleware(apolloServer));

  // 3. REST API Routes
  app.use('/api/gaming', gamingRoutes);
  app.use('/api/defi', defiRoutes);
  app.use('/api/nft', nftRoutes);
  app.use('/api/launchpad', launchpadRoutes);
  app.use('/api/governance', governanceRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/analytics', analyticsRoutes);
  
  // Initialize the match routes, passing the dependencies (matches data and broadcast function)
  app.use('/api/matches', matchRoutes({ matches, broadcastMatchUpdate }));

    // 4. START SIMULATION
    startMatchSimulation();

  // 5. Error Handler (500)
  app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  // 6. 404 Error Handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl
    });
  });

  // 7. START HTTP SERVER
  server.listen(PORT, () => {
    console.log(`🚀 Lumeris Dapp Backend running on port ${PORT}`);
    console.log(`📊 Health:    http://localhost:${PORT}/health`);
    console.log(`🧬 GraphQL:   http://localhost:${PORT}/graphql`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  });
}

// --- Initialization & Startup ---
startServer();

// --- GRACEFUL SHUTDOWN ---
process.on('SIGTERM', () => {
  console.log('SIGTERM received, exiting...');
  server.close(() => console.log('Process terminated'));
});

module.exports = app;