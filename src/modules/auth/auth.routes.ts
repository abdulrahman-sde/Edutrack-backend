import { Router } from "express";
import {
  loginController,
  registerAdminController,
  logoutController,
} from "./auth.controller.js";

const router = Router();

router.post("/login", loginController);
router.post("/register-admin", registerAdminController);
router.post("/logout", logoutController);

export default router;
