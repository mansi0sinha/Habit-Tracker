import express from 'express';
import {registerUser} from "../controllers/auth.controller.js"
const router = express.Router();
//Routing
router.post('/test-user',registerUser);
export default router;
