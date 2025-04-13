import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import * as jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";
import { checkAuth, fetchRole } from "../autherization";
import userService from "../services/user.sevice";

// Import GraphQLUpload from graphql-upload v13
import { GraphQLUpload } from "graphql-upload";

const resolvers = {
  DateTime: DateTimeResolver,
  Json: JSONResolver,
  Upload: GraphQLUpload,

  Query: {
    login: async (_parent: any, args: any, { res }: any) => {
      const result = await userService.login(args.email, args.password);

      if (result.status === "success") {
        const auth = jwt.sign(
          { id: result.userId, role: result.role },
          process.env.JWT_SECRET_KEY as string
        );

        res.cookie("Authorization", auth, {
          expires: new Date(Date.now() + 45000000),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
      }

      return result;
    },

    fetchAllRequests: async (_parent: any, _args: any, { req }: any) => {
      if (checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        return userService.fetchAllRequests();
      }
      throw new GraphQLError("Unauthorized", {
        extensions: { code: "FORBIDDEN" },
      });
    },

    rejectRequest: async (_parent: any, args: any, { req }: any) => {
      if (checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        return userService.rejectRequest(args.id);
      }
      throw new GraphQLError("Unauthorized", {
        extensions: { code: "FORBIDDEN" },
      });
    },

    getPendingDrivers: async (_parent: any, _args: any, { req }: any) => {
      if (checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        return userService.getPendingDrivers();
      }
      throw new GraphQLError("Unauthorized", {
        extensions: { code: "FORBIDDEN" },
      });
    },

    getDriverById: async (_parent: any, args: any, { req }: any) => {
      const role = fetchRole(req.headers.cookie);
      if (checkAuth(["admin", "student"], role)) {
        return userService.getDriverById(args.id);
      }
      throw new GraphQLError("Unauthorized", {
        extensions: { code: "FORBIDDEN" },
      });
    },
  },

  Mutation: {
    createRequest: async (_parent: any, args: any) => {
      return userService.createRequest(args);
    },

    acceptRequest: async (_parent: any, args: any, { req }: any) => {
      if (checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        return userService.acceptRequest(args.id);
      }
      throw new GraphQLError("Unauthorized", {
        extensions: { code: "FORBIDDEN" },
      });
    },

    registerDriver: async (_parent: any, args: any, { req }: any) => {
      try {
        const role = fetchRole(req.headers.cookie);
        if (!checkAuth(["student"], role)) {
          throw new GraphQLError(
            "Unauthorized. Only students can register as drivers.",
            {
              extensions: { code: "FORBIDDEN" },
            }
          );
        }

        const cookies = req.headers.cookie
          ? req.headers.cookie.split(";").reduce((acc: any, cookie: string) => {
              const [key, value] = cookie.trim().split("=");
              acc[key] = value;
              return acc;
            }, {})
          : {};

        const auth = jwt.verify(
          cookies.Authorization,
          process.env.JWT_SECRET_KEY as string
        ) as any;
        const userId = auth.id;

        if (userId !== args.userId) {
          throw new GraphQLError(
            "Unauthorized. You can only register yourself as a driver.",
            {
              extensions: { code: "FORBIDDEN" },
            }
          );
        }

        // Get file from args - this works with graphql-upload
        const file = args.file;
        if (!file) throw new Error("File is required for registration.");

        // Pass file and other data to service
        return userService.registerDriver(file, args);
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Failed to register driver",
          driver: null,
        };
      }
    },

    approveDriver: async (_parent: any, args: any, { req }: any) => {
      if (checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        return userService.approveDriver(args.id);
      }
      throw new GraphQLError("Unauthorized", {
        extensions: { code: "FORBIDDEN" },
      });
    },

    rejectDriver: async (_parent: any, args: any, { req }: any) => {
      if (checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        return userService.rejectDriver(args.id);
      }
      throw new GraphQLError("Unauthorized", {
        extensions: { code: "FORBIDDEN" },
      });
    },
  },
};

export default resolvers;
