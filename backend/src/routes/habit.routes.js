import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createHabit } from "../controllers/habit.controller.js";
const router=express.Router();
router.post('/',authMiddleware,createHabit);
export default router;