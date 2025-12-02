const { gql } = require('@apollo/client');

const typeDefs = gql`
  type MatchMetadata {
    gameTitle: String
    score: Int
  }

  type Match {
    id: ID!
    userId: String!
    gameId: String!
    amount: Float
    status: String
    timestamp: String
    metadata: MatchMetadata
  }

  type Query {
    matchTransactions: [Match]
    matchTransactionById(id: ID!): Match
    matchTransactionByUser(userId: String!): [Match]
    matchTransactionByGame(gameId: String!): [Match]
  }
`;

module.exports = typeDefs;
