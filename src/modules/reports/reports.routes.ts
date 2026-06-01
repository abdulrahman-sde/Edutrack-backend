import { Router } from "express";
import { statsController, studentReportsController, studentDetailController } from "./reports.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.get("/stats", authenticate, statsController);
router.get("/students/:studentId", authenticate, studentDetailController);
router.get("/", authenticate, studentReportsController);

export default router;
