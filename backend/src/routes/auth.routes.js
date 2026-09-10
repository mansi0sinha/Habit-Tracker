import express from "express";

import {
    registerUser,
    loginUser,
    updateProfile
} from "../controllers/auth.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.put("/profile", authMiddleware, updateProfile);

export default router;

