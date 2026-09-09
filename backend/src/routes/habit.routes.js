import express from "express";

import { authMiddleware } from "../middleware/auth.middleware.js";

import {
  createHabit,
  getHabits,
  updateHabit,
  deleteHabit,
  createCheckIn,
  getHabitStats,
  getCheckIns,
} from "../controllers/habit.controller.js";

const router = express.Router();
router.post("/", authMiddleware, createHabit);
router.get("/", authMiddleware, getHabits);

router.put("/:id", authMiddleware, updateHabit);
router.delete("/:id", authMiddleware, deleteHabit);

router.get("/checkins", authMiddleware, getCheckIns);

router.post("/:id/checkin", authMiddleware, createCheckIn);
router.get("/:id/stats", authMiddleware, getHabitStats);

export default router;