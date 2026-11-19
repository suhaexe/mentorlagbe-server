import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middleware/index.js";
import * as controller from "../controllers/payments.controller.js";

const router = Router();

router.post("/checkout", verifyToken, controller.createCheckoutSession);
router.get("/verify", controller.verifySession);
router.get("/admin/all", verifyToken, verifyAdmin, controller.getAllPayments);

export default router;