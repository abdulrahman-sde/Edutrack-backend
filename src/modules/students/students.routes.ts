import { Router } from "express";
import {
  listStudentsController,
  getStudentController,
  createStudentController,
  updateStudentController,
  enrollStudentController,
} from "./students.controller.js";
import { authenticate, authorize } from "../../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listStudentsController);
router.get("/:id", authenticate, getStudentController);
router.post("/", authenticate, authorize("admin"), createStudentController);
router.patch("/:id", authenticate, authorize("admin"), updateStudentController);
router.post("/:id/enroll", authenticate, authorize("admin"), enrollStudentController);

export default router;
