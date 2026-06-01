import { Router } from "express";
import {
  saveAttendanceController,
  getAttendanceController,
  getAttendanceSummaryController,
} from "./attendance.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.post("/:classId/attendance", authenticate, saveAttendanceController);
router.get("/:classId/attendance", authenticate, getAttendanceController);
router.get("/:classId/attendance/summary", authenticate, getAttendanceSummaryController);

export default router;
