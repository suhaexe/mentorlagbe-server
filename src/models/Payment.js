import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, lowercase: true },
    userName: String,
    userRole: { type: String, enum: ["student", "tutor"], required: true },
    planName: { type: String, required: true }, 
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    transactionId: { type: String, required: true },
    stripeSessionId: { type: String, required: true, unique: true },
    paymentStatus: { type: String, enum: ["paid"], default: "paid" },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

paymentSchema.index({ userEmail: 1 });

export default mongoose.model("Payment", paymentSchema, "payments");