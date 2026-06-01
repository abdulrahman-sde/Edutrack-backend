import { Router } from "express";
import {
  listAssessmentsController,
  createAssessmentController,
  saveMarksController,
} from "./assessments.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.get("/:classId/assessments", authenticate, listAssessmentsController);
router.post("/:classId/assessments", authenticate, createAssessmentController);
router.put("/:classId/assessments/:assessmentId/marks", authenticate, saveMarksController);

export default router;
