import jwt from "jsonwebtoken";
export const authMiddleware =(req,res,next)=>{
const authHeader=req.headers.authorization;
if(!authHeader){
    return res.status(401).json({
        message:"Authentication required"
    });
}
}