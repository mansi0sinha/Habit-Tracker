import express from 'express';
const router=express.Router();
router.post('/test-user',(req,res)=>{
    res.send({
         email: req.body.email,
    password: req.body.password,
    timezone: req.body.timezone
    });
});
export default router;
