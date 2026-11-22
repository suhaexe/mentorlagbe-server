import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true, lowercase: true },
    emailVerified: Boolean,
    image: String,
    role: { type: String, enum: ["student", "tutor", "admin"], default: "student" },
    phone: String,
    bio: String,
    plan: { type: String, enum: ["free", "pro"], default: "free" },
  },
  { timestamps: true, strict: false }
);

export default mongoose.model("User", userSchema, "users");