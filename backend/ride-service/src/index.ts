import dotenv from 'dotenv';
dotenv.config();

import { ApolloServer } from 'apollo-server';
import { typeDefs } from './graphql/ride.typeDefs';
import { resolvers } from './graphql/ride.resolvers';
import { prisma } from './database/prismaClient';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({ prisma }),
});

const PORT = process.env.PORT || 3001;

server.listen({ port: PORT }).then(({ url }) => {
  console.log(`Ride service running at ${url}`);
});