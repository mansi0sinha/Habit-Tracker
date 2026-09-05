import { habitSchema } from "../validators/habit.validator.js";
import Habit from "../models/Habit.js";
export const createHabit = async (req, res) => {
    try {
        const result = habitSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                error: result.error.issues
            })
        }
        const habit = await Habit.create({
            name: result.data.name,
            description: result.data.description,
            owner: req.user
        });
        return res.status(201).json({
            message: "Habit created successfully",
            habit: {
                id: habit._id,
                name: habit.name,
                description: habit.description,
                owner: habit.owner,
                createdAt: habit.createdAt,
                updatedAt: habit.updatedAt
            }
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error occurred",
            error: error.message
        });
    }
};
export const getHabits = async (req, res) => {
    try {
        const result = await Habit.find({ owner: req.user });

        return res.status(200).json({
            habits: result
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message
        });
    }
};