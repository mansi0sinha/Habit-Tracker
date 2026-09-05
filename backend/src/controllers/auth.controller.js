import User from "../models/User.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

      return  res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                email: user.email,
                timezone: user.timezone
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error occurred",
            error: error.message
        });
    }

};
export const loginUser = async (req, res) => {
    try {
        const result = loginSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                error: result.error.issues

            });

        }
        const user = await User.findOne({
            email: result.data.email
        })
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            })
        }
        else {
            const isPasswordCorrect = await bcrypt.compare(
                result.data.password, user.password
            )
            if (!isPasswordCorrect) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            )
            return res.status(200).json({
                message: "Login successful",
                token: token
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error occurred",
            error: error.message
        });
    }

};