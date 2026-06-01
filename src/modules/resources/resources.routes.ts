import { Router } from "express";
import multer from "multer";
import {
  listResourcesController,
  createResourceController,
  updateResourceController,
  deleteResourceController,
} from "./resources.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.get("/resources", authenticate, listResourcesController);
router.post("/resources", authenticate, upload.single("file"), createResourceController);
router.put("/resources/:id", authenticate, updateResourceController);
router.delete("/resources/:id", authenticate, deleteResourceController);

export default router;
