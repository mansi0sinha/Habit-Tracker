import express from "express";

import {
  generateHabitCoach
} from "../controllers/ai.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/coach",
  authMiddleware,
  generateHabitCoach
);

export default router;