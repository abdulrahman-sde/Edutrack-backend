import { Router } from "express";
import {
  listSubjectsController,
  createSubjectController,
} from "./subjects.controller.js";
import { authenticate, authorize } from "../../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, listSubjectsController);
router.post("/", authenticate, authorize("admin"), createSubjectController);

export default router;
