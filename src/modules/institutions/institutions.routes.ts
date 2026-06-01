import { Router } from "express";
import { institutionsController } from "./institutions.controller.js";

const router = Router();

router.post("/", institutionsController.create);
export default router;
