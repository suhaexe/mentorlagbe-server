import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { MongoClient } from "mongodb";

const isProduction = process.env.NODE_ENV === "production";

const clientOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const SIGNUP_ROLES = ["student", "tutor"];

const client = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 5 });
const db = client.db();

const advanced = isProduction
  ? {
      defaultCookieAttributes: {
        sameSite: process.env.COOKIE_SAMESITE || "none",
        secure: true,
      },
      ...(process.env.COOKIE_DOMAIN
        ? {
            crossSubDomainCookies: {
              enabled: true,
              domain: process.env.COOKIE_DOMAIN,
            },
          }
        : {}),
    }
  : {};

export const auth = betterAuth({
  database: mongodbAdapter(db, { usePlural: true }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  trustedOrigins: [
    ...clientOrigins,
    ...(isProduction ? [] : ["http://localhost:3000", "http://localhost:5000"]),
  ],

  advanced,

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  emailAndPassword: { enabled: true },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      bio: { type: "string", required: false },
      plan: { type: "string", defaultValue: "free", input: false },
      role: { type: "string", defaultValue: "student", input: false },
      requestedRole: { type: "string", required: false, input: true },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const { requestedRole, ...rest } = user;
          const role = SIGNUP_ROLES.includes(requestedRole) ? requestedRole : "student";
          return { data: { ...rest, role } };
        },
      },
    },
  },

  plugins: [
    admin({
      defaultRole: "student",
      adminRoles: ["admin"],
      roles: {
        student: {},
        tutor: {},
        admin: {},
      },
    }),
  ],
});