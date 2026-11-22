import mongoose from "mongoose";

const cache = (globalThis.__mongooseCache ??= { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;

  cache.promise ??= mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 8000,
  });

  try {
    cache.conn = await cache.promise;
    console.log("MongoDB connected");
    return cache.conn;
  } catch (error) {
    cache.promise = null;
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
}