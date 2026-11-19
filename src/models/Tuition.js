import mongoose from "mongoose";

const tuitionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    classLevel: { type: String, required: true },
    mode: { type: String, enum: ["Online", "Offline"], required: true },
    location: { type: String, default: "" },
    monthlyFee: { type: Number, required: true },
    daysPerWeek: { type: Number, required: true },
    bannerImage: { type: String, required: true },
    description: { type: String, required: true },
    tutorName: { type: String, required: true },
    tutorEmail: { type: String, required: true, lowercase: true },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Challenge 1: search + filter indexes
tuitionSchema.index({ title: "text", subject: "text" });
tuitionSchema.index({ approvalStatus: 1, isActive: 1 });
tuitionSchema.index({ subject: 1, classLevel: 1, mode: 1 });

export default mongoose.model("Tuition", tuitionSchema, "tuitions");