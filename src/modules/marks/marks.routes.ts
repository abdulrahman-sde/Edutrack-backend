import { Router } from "express";
import { getMarksController, saveMarksController } from "./marks.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.get("/:examId/marks", authenticate, getMarksController);
router.put("/:examId/marks", authenticate, saveMarksController);

export default router;
