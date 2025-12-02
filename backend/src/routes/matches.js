const express = require('express');
const { getTransactions } = require('../data/mockData.js');

// Export a function that creates and returns the router,
// accepting dependencies as an argument.
module.exports = ({ matches, broadcastMatchUpdate }) => {
  const router = express.Router();

  // GET /api/matches?userId=&gameId=&status=
  router.get('/', (req, res) => {
    try {
      let txs = getTransactions().filter(tx => tx.type === 'game_reward');

      // ... (existing filtering logic remains the same)
      if (req.query.userId) {
        txs = txs.filter(tx => tx.userId === req.query.userId);
      }
      if (req.query.gameId) {
        txs = txs.filter(tx => tx.gameId === req.query.gameId);
      }
      if (req.query.status) {
        txs = txs.filter(tx => tx.status === req.query.status);
      }

      console.log(`[MATCH API] Retrieved ${txs.length} matches`);
      res.json(txs);
    } catch (err) {
      console.error('[MATCH API ERROR]', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/matches/:id
  router.get('/:id', (req, res) => {
    try {
      // Check both mock data and live match data for completeness
      let match = getTransactions().find(
        tx => tx.id === req.params.id && tx.type === 'game_reward'
      );
      
      // OPTIONAL: If the match is live, merge the current state from 'matches'
      if (matches[req.params.id]) {
          match = { ...match, ...matches[req.params.id] };
      }

      if (!match) return res.status(404).json({ error: 'Match not found' });

      res.json(match);
    } catch (err) {
      console.error('[MATCH API ERROR]', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/matches/:id/update - NEW ENDPOINT using broadcastMatchUpdate
  router.post('/:id/update', (req, res) => {
    const { id } = req.params;
    const update = req.body;

    // Use the function passed from the main server
    broadcastMatchUpdate(id, update);

    res.json({ success: true, matchId: id, data: matches[id] });
  });

  return router;
};