const Match = require('../models/match');
const matchSchema = require('../validators/matchValidators');

// GET /api/matches
exports.getMatches = async (req, res) => {
  try {
    const { status, league, page = 1, limit = 10 } = req.query;

    const filters = {};
    if (status) filters.status = status.toUpperCase();
    if (league) filters.league = league;

    const perPage = parseInt(limit);
    const skip = (page - 1) * perPage;

    const [matches, total] = await Promise.all([
      Match.find(filters).sort({ startTime: 1 }).skip(skip).limit(perPage).lean(),
      Match.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      count: matches.length,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / perPage) },
      data: matches,
    });
  } catch (err) {
    console.error('❌ Error fetching matches:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// POST /api/matches
exports.createMatch = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = matchSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((d) => d.message),
      });
    }

    const match = await Match.create(value);
    res.status(201).json({ success: true, data: match });
  } catch (err) {
    console.error('❌ Error creating match:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
