import User from "../models/User.js";
export const registerUser = async (req, res) => {
    
        const user = await User.create({
            email: req.body.email,
            password: req.body.password,
            timezone: req.body.timezone
        });
        res.send(user);
    };