import { Router } from "express";
import {
  listExamsController,
  getExamController,
  createExamController,
  updateExamController,
  deleteExamController,
  listTeacherExamsController,
} from "./exams.controller.js";
import marksRoutes from "../marks/marks.routes.js";
import { authenticate, authorize } from "../../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listExamsController);
router.get("/mine", authenticate, listTeacherExamsController);
router.get("/:id", authenticate, getExamController);
router.post("/", authenticate, authorize("admin"), createExamController);
router.patch("/:id", authenticate, authorize("admin"), updateExamController);
router.delete("/:id", authenticate, authorize("admin"), deleteExamController);

router.use("/", marksRoutes);

export default router;
