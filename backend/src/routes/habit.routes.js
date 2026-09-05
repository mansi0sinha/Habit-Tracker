import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createHabit, getHabits } from "../controllers/habit.controller.js";
const router=express.Router();
router.post('/',authMiddleware,createHabit);
router.get('/', authMiddleware, getHabits);

export default router;