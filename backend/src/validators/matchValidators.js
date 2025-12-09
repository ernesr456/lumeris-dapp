const Joi = require('joi');

const matchSchema = Joi.object({
  homeTeam: Joi.string().required(),
  awayTeam: Joi.string().required(),
  league: Joi.string().required(),
  startTime: Joi.date().required(),
  odds: Joi.object({
    homeWin: Joi.number().optional(),
    draw: Joi.number().optional(),
    awayWin: Joi.number().optional(),
  }).optional()
});

module.exports = matchSchema;
