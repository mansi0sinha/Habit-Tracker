import User from "../models/User.js";
import { registerSchema } from "../validators/auth.validator.js";
import bcrypt from "bcrypt";
export const registerUser = async (req, res) => {
    try {
        const result = registerSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                error: result.error.issues
            })

        }
        const hashedPassword = await bcrypt.hash(result.data.password, 10);
        const user = await User.create({
            email: result.data.email,
            password: hashedPassword,
            timezone: result.data.timezone
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                email: user.email,
                timezone: user.timezone
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error occurred",
            error: error.message
        });
    }

};