import User from "../models/User.js";
import { registerSchema } from "../validators/auth.validator.js";
export const registerUser = async (req, res) => {
    try {
        const result=registerSchema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({
                message:"Validation failed",
                error:result.error
            })

        }
        const user = await User.create({
            email: req.body.email,
            password: req.body.password,
            timezone: req.body.timezone
        });
        res.send(user);
    } catch (error) {
        console.log(error);
        res.send("Error occurred");
    }

};