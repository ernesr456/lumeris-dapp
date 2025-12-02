const { getTransactions } = require('../data/mockData.js');

const getMatchTransactions = () =>
  getTransactions().filter(tx => tx.type === 'game_reward');

const resolvers = {
  Query: {
    matchTransactions: () => getMatchTransactions(),

    matchTransactionById: (_, { id }) =>
      getMatchTransactions().find(tx => tx.id === id),

    matchTransactionByUser: (_, { userId }) =>
      getMatchTransactions().filter(tx => tx.userId === userId),

    matchTransactionByGame: (_, { gameId }) =>
      getMatchTransactions().filter(tx => tx.gameId === gameId),
  },
};

module.exports = resolvers;
