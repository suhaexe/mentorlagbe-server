import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middleware/index.js";
import User from "../models/User.js";

const router = Router();

router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/role", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { role } = req.body; // 'student', 'tutor', 'admin'
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, phone, bio, image } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { name, phone, bio, image },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/stats", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTutors = await User.countDocuments({ role: "tutor" });
    
    const Tuition = (await import("../models/Tuition.js")).default;
    const pendingTuitions = await Tuition.countDocuments({ approvalStatus: "pending" });

    res.json({ totalUsers, totalTutors, pendingTuitions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;