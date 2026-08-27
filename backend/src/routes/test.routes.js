import express from 'express';
import User from "../models/User.js";
const router = express.Router();
// routing using express
router.post('/test-user', async (req, res) => {
    const user = await User.create({
        email: req.body.email,
        password: req.body.password,
        timezone: req.body.timezone
    });
    res.send(user);
});
export default router;
