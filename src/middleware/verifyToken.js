import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.slice(7).trim();

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    const message = error.name === "TokenExpiredError" ? "Token expired." : "Invalid token.";
    return res.status(401).json({ message });
  }

  try {
    const user = await User.findById(decoded.userId).select("email role banned").lean();

    if (!user) {
      return res.status(401).json({ message: "Account no longer exists." });
    }
    if (user.banned) {
      return res.status(403).json({ message: "Account is banned." });
    }

    req.user = { userId: String(user._id), email: user.email, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
};