import { Router } from "express";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/issue", async (req, res) => {
  try {
    // 1. Get BetterAuth session from cookie/headers
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized: No active session" });
    }

    // 2. Generate custom JWT for Express API
    const token = jwt.sign(
      { 
        userId: session.user.id, 
        email: session.user.email, 
        role: session.user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, role: session.user.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;