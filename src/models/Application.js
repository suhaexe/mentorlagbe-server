import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    tuitionId: { type: mongoose.Schema.Types.ObjectId, ref: "Tuition", required: true },
    tuitionTitle: { type: String, required: true },
    subject: String,
    monthlyFee: Number,
    tutorEmail: { type: String, required: true, lowercase: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true, lowercase: true },
    studentPhone: { type: String, required: true },
    preferredSchedule: { type: String, required: true },
    studentNote: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Req #76: prevent duplicate applications (same student, same tuition)
applicationSchema.index({ tuitionId: 1, studentEmail: 1 }, { unique: true });
// Query helpers for dashboards
applicationSchema.index({ studentEmail: 1, status: 1 });
applicationSchema.index({ tutorEmail: 1, status: 1 });

export default mongoose.model("Application", applicationSchema, "applications");