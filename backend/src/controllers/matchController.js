const Match = require('../models/match');

// GET /api/matches
// Fetch matches with filters + pagination
exports.getMatches = async (req, res) => {
  try {
    const { status, league, page = 1, limit = 10 } = req.query;

    // Build dynamic filters
    const filters = {};
    if (status) filters.status = status.toUpperCase();
    if (league) filters.league = league;

    // Pagination math
    const perPage = parseInt(limit);
    const skip = (page - 1) * perPage;

    // Query the database
    const [results, total] = await Promise.all([
      Match.find(filters)
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Match.countDocuments(filters)
    ]);

    return res.status(200).json({
      success: true,
      count: results.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / perPage)
      },
      data: results
    });

  } catch (err) {
    console.error('❌ Failed to load matches:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// POST /api/matches
// Create a new match entry
exports.createMatch = async (req, res) => {
  try {
    const newMatch = await Match.create(req.body);

    return res.status(201).json({
      success: true,
      data: newMatch
    });

  } catch (err) {
    console.error('❌ Failed to create match:', err);
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
};
