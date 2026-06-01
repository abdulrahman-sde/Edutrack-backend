import { Router } from "express";
import {
  listTeachersController,
  getTeacherController,
  createTeacherController,
  updateTeacherController,
} from "./teachers.controller.js";
import { authenticate, authorize } from "../../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listTeachersController);
router.get("/:id", authenticate, getTeacherController);
router.post("/", authenticate, authorize("admin"), createTeacherController);
router.patch("/:id", authenticate, authorize("admin"), updateTeacherController);

export default router;
