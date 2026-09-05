import jwt from "jsonwebtoken";
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }
    try {
        const decoded = jwt.verify(
            authHeader.split(" ")[1],
            process.env.JWT_SECRET
        );
         req.user=decoded.userId;
         next();
    } catch (error) {
        return res.status(401).json({
            message: "Authentication error"
        });
    }
   

}