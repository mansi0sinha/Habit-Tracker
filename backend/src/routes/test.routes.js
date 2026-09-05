import express from 'express';
import {registerUser,loginUser} from "../controllers/auth.controller.js";
import {authMiddleware} from "../middleware/auth.middleware.js"
const router = express.Router();
//Routing
router.post('/test-user',registerUser);
router.post('/test-login',loginUser);
router.get('/test-route',authMiddleware,(req,res)=>{
    return res.status(200).json({
        message:"You are authenticated"
    });
});
export default router;
