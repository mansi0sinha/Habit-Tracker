import express from 'express';
import {registerUser,loginUser} from "../controllers/auth.controller.js"
const router = express.Router();
//Routing
router.post('/test-user',registerUser);
router.post('/test-login',loginUser);
export default router;
