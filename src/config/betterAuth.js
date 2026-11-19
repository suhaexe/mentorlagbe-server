import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, { usePlural: true }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  
  // Explicitly allow both origins
  trustedOrigins: ["http://localhost:3000", "http://localhost:5000"],

  // CRITICAL for cross-port OAuth
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true, // Must be true for SameSite=None. Browsers allow this on localhost.
    },
  },

  // Explicitly configure the state cookie
  cookies: {
    state: {
      attributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
        path: "/",
      },
    },
  },

  // Allow linking Google account to existing email/password account
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
      plan: { type: "string", defaultValue: "free" },
      role: { type: "string", defaultValue: "student", input: false },
      requestedRole: { type: "string", required: false, input: true },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.requestedRole) {
            user.role = user.requestedRole;
            delete user.requestedRole;
          }
          return { data: user };
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