import { habitSchema } from "../validators/habit.validator.js";
import Habit from "../models/Habit.js";
import User from "../models/User.js";
import CheckIn from "../models/CheckIn.js";
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
export const deleteHabit = async (req, res) => {
    try {
        const result = await Habit.findOne(
            {
                _id: req.params.id,
                owner: req.user
            })
        if (!result) {
            return res.status(404).json({
                message: "Error occured"
            });

        }
        await result.deleteOne();
        return res.status(200).json({
            message: "Record deleted Successfully"
        })

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message
        });
    }

};
export const createCheckIn = async (req, res) => {
    try {
         console.log("Habit ID:", req.params.id);
        console.log("Logged-in user:", req.user);
        const result = await Habit.findOne({
            _id: req.params.id,
            owner: req.user
        });

        if (!result) {
            return res.status(404).json({
                message: "Habit not found"
            });
        }

        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const timezone = user.timezone;

        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());

        const existingCheckIn = await CheckIn.findOne({
            habit: result._id,
            localDate: today
        });

        if (existingCheckIn) {
            return res.status(409).json({
                message: "Habit already checked in for today"
            });
        }

        const checkIn = await CheckIn.create({
            habit: result._id,
            localDate: today,
            checkedAt: new Date()
        });

        return res.status(201).json({
            message: "Check-in created successfully",
            checkIn: {
                id: checkIn._id,
                habit: checkIn.habit,
                localDate: checkIn.localDate,
                checkedAt: checkIn.checkedAt
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
export const getHabitStats = async (req, res) => {
    try {
        const habit = await Habit.findOne({
            _id: req.params.id,
            owner: req.user
        });

        if (!habit) {
            return res.status(404).json({
                message: "Habit not found"
            });
        }

        const checkIns = await CheckIn.find({
            habit: habit._id
        }).sort({ localDate: 1 });

        if (checkIns.length === 0) {
            return res.status(200).json({
                currentStreak: 0,
                longestStreak: 0
            });
        }

        const dates = checkIns.map(checkIn => checkIn.localDate);

        let currentStreak = 1;
        let longestStreak = 1;
        let streak = 1;

        for (let i = 1; i < dates.length; i++) {
            const previousDate = new Date(dates[i - 1]);
            const currentDate = new Date(dates[i]);

            const difference =
                (currentDate - previousDate) / (1000 * 60 * 60 * 24);

            if (difference === 1) {
                streak++;

                if (streak > longestStreak) {
                    longestStreak = streak;
                }
            } else {
                streak = 1;
            }
        }

        const user = await User.findById(req.user);

        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: user.timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());

        const lastCheckInDate = dates[dates.length - 1];

        if (lastCheckInDate === today) {
            currentStreak = streak;
        } else {
            currentStreak = 0;
        }

        return res.status(200).json({
            currentStreak,
            longestStreak
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message
        });
    }
};