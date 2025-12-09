const express = require('express');
const router = express.Router();

const {
  getMatches,
  createMatch
} = require('../controllers/matchController');

// Match list + creation endpoints
router.get('/', getMatches);
router.post('/', createMatch);

module.exports = router;
