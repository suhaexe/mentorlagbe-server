import { Router } from "express";
import { verifyToken, verifyTutor, verifyStudent } from "../middleware/index.js";
import * as controller from "../controllers/applications.controller.js";

const router = Router();

router.get("/tutor", verifyToken, verifyTutor, controller.getTutorApplications);
router.patch("/:id/status", verifyToken, verifyTutor, controller.updateApplicationStatus);

router.get("/student", verifyToken, verifyStudent, controller.getStudentApplications);
router.post("/", verifyToken, verifyStudent, controller.createApplication);
router.delete("/:id", verifyToken, verifyStudent, controller.deleteApplication);

export default router;