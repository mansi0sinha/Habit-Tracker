import User from "../models/User.js";
import { registerSchema } from "../validators/auth.validator.js";
export const registerUser = async (req, res) => {
    try {
        const result = registerSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                error: result.error.issues
            })

        }
        const user = await User.create({
            email: result.data.email,
            password: result.data.password,
            timezone: result.data.timezone
        });
        res.send(user);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error occurred",
            error: error.message
        });
    }

};