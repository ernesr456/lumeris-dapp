const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const matchSchema = new Schema(
  {
    homeTeam: {
      type: String,
      required: [true, 'Home team is required'],
      trim: true,
    },

    awayTeam: {
      type: String,
      required: [true, 'Away team is required'],
      trim: true,
    },

    league: {
      type: String,
      required: true,
      index: true,
    },

    score: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ['SCHEDULED', 'LIVE', 'FINISHED', 'PAUSED'],
      default: 'SCHEDULED',
      index: true,
    },

    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    odds: {
      homeWin: { type: Number, default: null },
      draw: { type: Number, default: null },
      awayWin: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for optimized queries by league + status
matchSchema.index({ league: 1, status: 1 });

module.exports = model('Match', matchSchema);
