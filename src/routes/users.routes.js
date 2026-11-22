import { Router } from "express";
import mongoose from "mongoose";
import { verifyToken, verifyAdmin } from "../middleware/index.js";
import User from "../models/User.js";
import Tuition from "../models/Tuition.js";

const router = Router();

const ROLES = ["student", "tutor", "admin"];
const DEFAULT_LIST_LIMIT = 100;
const MAX_LIST_LIMIT = 200;

const isHttpsUrl = (value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

router.get("/", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const requested = parseInt(req.query.limit, 10);
    const limit = Math.min(
      Number.isFinite(requested) && requested > 0 ? requested : DEFAULT_LIST_LIMIT,
      MAX_LIST_LIMIT,
    );

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(limit).lean(),
      User.countDocuments(),
    ]);

    res.set("X-Total-Count", String(total));
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/role", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: "Role must be student, tutor or admin" });
    }
    if (id === String(req.user.userId)) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true },
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put("/profile", verifyToken, async (req, res, next) => {
  try {
    const { name, phone, bio, image } = req.body;
    const update = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
        return res.status(400).json({ message: "Name must be 1 to 80 characters" });
      }
      update.name = name.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== "string" || phone.trim().length > 20) {
        return res.status(400).json({ message: "Phone must be at most 20 characters" });
      }
      update.phone = phone.trim();
    }

    if (bio !== undefined) {
      if (typeof bio !== "string" || bio.trim().length > 500) {
        return res.status(400).json({ message: "Bio must be at most 500 characters" });
      }
      update.bio = bio.trim();
    }

    if (image !== undefined) {
      if (typeof image !== "string" || (image !== "" && !isHttpsUrl(image))) {
        return res.status(400).json({ message: "Image must be an https URL" });
      }
      update.image = image;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.userId, update, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

router.get("/stats", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const [totalUsers, totalTutors, pendingTuitions] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "tutor" }),
      Tuition.countDocuments({ approvalStatus: "pending" }),
    ]);

    res.json({ totalUsers, totalTutors, pendingTuitions });
  } catch (error) {
    next(error);
  }
});

export default router;