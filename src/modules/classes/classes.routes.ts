import { Router } from "express";
import {
  listClassesController,
  getClassController,
  createClassController,
  updateClassController,
  deleteClassController,
} from "./classes.controller.js";
import { authenticate, authorize } from "../../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listClassesController);
router.get("/:id", authenticate, getClassController);
router.post("/", authenticate, authorize("admin"), createClassController);
router.patch("/:id", authenticate, authorize("admin"), updateClassController);
router.delete("/:id", authenticate, authorize("admin"), deleteClassController);

export default router;
