import { Router } from "express";
import { verifyToken, verifyTutor, verifyAdmin } from "../middleware/index.js";
import * as controller from "../controllers/tuitions.controller.js";

const router = Router();

// 1. Specific GET routes (Must be before /:id)
router.get("/admin/all", verifyToken, verifyAdmin, controller.getAllAdminTuitions);
router.get("/my-tuitions/list", verifyToken, verifyTutor, controller.getMyTuitions);
router.get("/featured", controller.getFeaturedTuitions);

// 2. General Public routes
router.get("/", controller.getPublicTuitions);
router.get("/:id", controller.getTuitionById); // 👈 This must be last among GET routes

// 3. Mutations
router.post("/", verifyToken, verifyTutor, controller.createTuition);
router.put("/:id", verifyToken, verifyTutor, controller.updateTuition);
router.delete("/:id", verifyToken, verifyTutor, controller.deleteTuition);
router.patch("/:id/toggle", verifyToken, verifyTutor, controller.toggleTuitionStatus);
router.patch("/:id/status", verifyToken, verifyAdmin, controller.updateApprovalStatus);

export default router;