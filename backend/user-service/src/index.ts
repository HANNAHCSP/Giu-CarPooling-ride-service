import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import * as dotenv from "dotenv";
import * as path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import graphql-upload v13
import { graphqlUploadExpress } from "graphql-upload";

import typeDefs from "./graphql/user.typeDefs";
import resolvers from "./graphql/user.resolvers";

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Parse cookies
  app.use(cookieParser());

  // IMPORTANT: Add upload middleware before Apollo middleware
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

  // Serve static files for uploaded images
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    //csrfPrevention: false, // Disable for development
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  };

  // Use the root path for GraphQL
  app.use(
    "/", // Use root path instead of /graphql
    cors(corsOptions),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req, res }) => ({ req, res }),
    })
  );

  const PORT = process.env.PORT || 4000;
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
