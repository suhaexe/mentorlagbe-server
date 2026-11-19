import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./src/config/betterAuth.js";
import { connectDB } from "./src/config/db.js";

// Routes
import authRoutes from "./src/routes/auth.routes.js";
import usersRoutes from "./src/routes/users.routes.js";
import tuitionsRoutes from "./src/routes/tuitions.routes.js";
import applicationsRoutes from "./src/routes/applications.routes.js";
import paymentsRoutes from "./src/routes/payments.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";

// Controllers
import { handleWebhook } from "./src/controllers/payments.controller.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.all("/api/auth/*splat", toNodeHandler(auth));

// Stripe webhook needs raw body — mount before express.json
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleWebhook);

app.use(express.json({ limit: "10mb" })); 

// Routes
app.use("/api/auth", authRoutes); 
app.use("/api/jwt", authRoutes); 
app.use("/api/users", usersRoutes);
app.use("/api/tuitions", tuitionsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => res.json({ status: "ok", service: "MentorLagbe API" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});