import { habitSchema } from "../validators/habit.validator.js";
import Habit from "../models/Habit.js";
import User from "../models/User.js";
import CheckIn from "../models/CheckIn.js";

// =========================
// CREATE HABIT
// =========================
export const createHabit = async (req, res) => {
    try {
        const result = habitSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                error: result.error.issues,
            });
        }

        const habit = await Habit.create({
            name: result.data.name,
            description: result.data.description,
            category: result.data.category,
            frequency: result.data.frequency,
            targetDays: result.data.targetDays,
            color: result.data.color,
            icon: result.data.icon,
            owner: req.user,
        });

        return res.status(201).json({
            message: "Habit created successfully",
            habit: {
                _id: habit._id,
                name: habit.name,
                description: habit.description,
                category: habit.category,
                frequency: habit.frequency,
                targetDays: habit.targetDays,
                color: habit.color,
                icon: habit.icon,
                owner: habit.owner,
                createdAt: habit.createdAt,
                updatedAt: habit.updatedAt,
            },
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message,
        });
    }
};

// =========================
// GET USER HABITS
// =========================
export const getHabits = async (req, res) => {
    try {
        const habits = await Habit.find({
            owner: req.user,
        }).sort({
            createdAt: -1,
        });

        return res.status(200).json({
            habits,
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message,
        });
    }
};

// =========================
// UPDATE HABIT
// =========================
export const updateHabit = async (req, res) => {
    try {
        const result = habitSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                error: result.error.issues,
            });
        }

        const habit = await Habit.findOne({
            _id: req.params.id,
            owner: req.user,
        });

        if (!habit) {
            return res.status(404).json({
                message: "Habit not found",
            });
        }

        habit.name = result.data.name;
        habit.description = result.data.description;
        habit.category = result.data.category;
        habit.frequency = result.data.frequency;
        habit.targetDays = result.data.targetDays;
        habit.color = result.data.color;
        habit.icon = result.data.icon;

        await habit.save();

        return res.status(200).json({
            message: "Habit updated successfully",
            habit: {
                _id: habit._id,
                name: habit.name,
                description: habit.description,
                category: habit.category,
                frequency: habit.frequency,
                targetDays: habit.targetDays,
                color: habit.color,
                icon: habit.icon,
                owner: habit.owner,
                createdAt: habit.createdAt,
                updatedAt: habit.updatedAt,
            },
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message,
        });
    }
};

// =========================
// DELETE HABIT
// =========================
export const deleteHabit = async (req, res) => {
    try {
        const habit = await Habit.findOne({
            _id: req.params.id,
            owner: req.user,
        });

        if (!habit) {
            return res.status(404).json({
                message: "Habit not found",
            });
        }

        // Delete all check-ins belonging to this habit
        await CheckIn.deleteMany({
            habit: habit._id,
        });

        // Delete the habit
        await habit.deleteOne();

        return res.status(200).json({
            message: "Habit deleted successfully",
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message,
        });
    }
};

// =========================
// CREATE CHECK-IN
// =========================
export const createCheckIn = async (req, res) => {
    try {
        const { date } = req.body;

        const habit = await Habit.findOne({
            _id: req.params.id,
            owner: req.user,
        });

        if (!habit) {
            return res.status(404).json({
                message: "Habit not found",
            });
        }

        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const timezone = user.timezone;

        // Get today's date according to user's timezone
        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date());

        // Validate date format
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                message: "Invalid date format. Use YYYY-MM-DD",
            });
        }

        const checkInDate = date || today;

        // Validate actual calendar date
        const [year, month, day] = checkInDate
            .split("-")
            .map(Number);

        const parsedDate = new Date(year, month - 1, day);

        if (
            parsedDate.getFullYear() !== year ||
            parsedDate.getMonth() !== month - 1 ||
            parsedDate.getDate() !== day
        ) {
            return res.status(400).json({
                message: "Invalid date",
            });
        }

        // Prevent future check-ins
        if (checkInDate > today) {
            return res.status(400).json({
                message: "Cannot check in for a future date",
            });
        }

        // Get the date when the habit was created
        const habitCreatedLocalDate = new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: timezone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }
        ).format(habit.createdAt);

        // Prevent check-in before habit existed
        if (checkInDate < habitCreatedLocalDate) {
            return res.status(400).json({
                message: "Cannot check in before the habit was created",
            });
        }

        // Check if already checked in
        const existingCheckIn = await CheckIn.findOne({
            habit: habit._id,
            localDate: checkInDate,
        });

        if (existingCheckIn) {
            return res.status(409).json({
                message: "Habit already checked in for this date",
            });
        }

        // Create check-in
        const checkIn = await CheckIn.create({
            habit: habit._id,
            localDate: checkInDate,
            checkedAt: new Date(),
        });

        return res.status(201).json({
            message: "Check-in created successfully",
            checkIn: {
                _id: checkIn._id,
                habit: checkIn.habit,
                localDate: checkIn.localDate,
                checkedAt: checkIn.checkedAt,
            },
        });
    } catch (error) {
        // Handle duplicate check-in race condition
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Habit already checked in for this date",
            });
        }

        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message,
        });
    }
};

// =========================
// GET HABIT STATS
// =========================
export const getHabitStats = async (req, res) => {
    try {
        const habit = await Habit.findOne({
            _id: req.params.id,
            owner: req.user,
        });

        if (!habit) {
            return res.status(404).json({
                message: "Habit not found",
            });
        }

        const checkIns = await CheckIn.find({
            habit: habit._id,
        }).sort({
            localDate: 1,
        });

        // No check-ins
        if (checkIns.length === 0) {
            return res.status(200).json({
                currentStreak: 0,
                longestStreak: 0,
            });
        }

        const dates = checkIns.map(
            (checkIn) => checkIn.localDate
        );

        let streak = 1;
        let longestStreak = 1;

        // Calculate longest streak
        for (let i = 1; i < dates.length; i++) {
            const previousDate = new Date(dates[i - 1]);
            const currentDate = new Date(dates[i]);

            const difference =
                (currentDate - previousDate) /
                (1000 * 60 * 60 * 24);

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

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // Today's date in user's timezone
        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: user.timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date());

        const lastCheckInDate = dates[dates.length - 1];

        let currentStreak = 0;

        // Current streak only exists if latest check-in is today
        if (lastCheckInDate === today) {
            currentStreak = streak;
        }

        return res.status(200).json({
            currentStreak,
            longestStreak,
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message,
        });
    }
};

// =========================
// GET CHECK-INS
// Used for dashboard + heatmap
// =========================
export const getCheckIns = async (req, res) => {
    try {
        const { start, end } = req.query;

        // Get user's habits
        const habits = await Habit.find({
            owner: req.user,
        }).select("_id");

        const habitIds = habits.map(
            (habit) => habit._id
        );

        const query = {
            habit: {
                $in: habitIds,
            },
        };

        // Optional date range
        if (start || end) {
            query.localDate = {};

            if (start) {
                query.localDate.$gte = start;
            }

            if (end) {
                query.localDate.$lte = end;
            }
        }

        const checkIns = await CheckIn.find(query)
            .select("habit localDate checkedAt")
            .sort({
                localDate: 1,
            });

        return res.status(200).json({
            checkIns,
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message,
        });
    }
};