import { Router } from "express";
import {
  listExamsController,
  getExamController,
  createExamController,
  updateExamController,
  deleteExamController,
} from "./exams.controller.js";
import { authenticate, authorize } from "../../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listExamsController);
router.get("/:id", authenticate, getExamController);
router.post("/", authenticate, authorize("admin"), createExamController);
router.patch("/:id", authenticate, authorize("admin"), updateExamController);
router.delete("/:id", authenticate, authorize("admin"), deleteExamController);

export default router;
