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
                error: result.error.issues
            });
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
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message
        });
    }
};


// =========================
// GET USER HABITS
// =========================
export const getHabits = async (req, res) => {
    try {
        const result = await Habit.find({
            owner: req.user
        });

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


// =========================
// DELETE HABIT
// =========================
export const deleteHabit = async (req, res) => {
    try {
        const result = await Habit.findOne({
            _id: req.params.id,
            owner: req.user
        });

        if (!result) {
            return res.status(404).json({
                message: "Habit not found"
            });
        }
        await CheckIn.deleteMany({
            habit: result._id
        });
        await result.deleteOne();

        return res.status(200).json({
            message: "Habit deleted successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message
        });
    }
};


// =========================
// CREATE CHECK-IN
// =========================
export const createCheckIn = async (req, res) => {
    try {
        const { date } = req.body;

        // 1. Find the habit and make sure it belongs to logged-in user
        const habit = await Habit.findOne({
            _id: req.params.id,
            owner: req.user
        });

        if (!habit) {
            return res.status(404).json({
                message: "Habit not found"
            });
        }


        // 2. Find the logged-in user
        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        // 3. Get user's timezone
        const timezone = user.timezone;


        // 4. Calculate today's date according to user's timezone
        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());


        // 5. If date was provided, validate its format
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                message: "Invalid date format. Use YYYY-MM-DD"
            });
        }


        // 6. Decide which date this check-in belongs to
        const checkInDate = date || today;


        // 7. Validate that it is a real calendar date
        const [year, month, day] = checkInDate.split("-").map(Number);

        const parsedDate = new Date(year, month - 1, day);

        if (
            parsedDate.getFullYear() !== year ||
            parsedDate.getMonth() !== month - 1 ||
            parsedDate.getDate() !== day
        ) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }


        // 8. Don't allow future dates
        if (checkInDate > today) {
            return res.status(400).json({
                message: "Cannot check in for a future date"
            });
        }


        // 9. Get the habit creation date in user's timezone
        const habitCreatedLocalDate = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(habit.createdAt);


        // 10. Don't allow check-in before habit existed
        if (checkInDate < habitCreatedLocalDate) {
            return res.status(400).json({
                message: "Cannot check in before the habit was created"
            });
        }


        // 11. Check whether this habit was already checked in for this date
        const existingCheckIn = await CheckIn.findOne({
            habit: habit._id,
            localDate: checkInDate
        });

        if (existingCheckIn) {
            return res.status(409).json({
                message: "Habit already checked in for this date"
            });
        }


        // 12. Create the check-in
        const checkIn = await CheckIn.create({
            habit: habit._id,
            localDate: checkInDate,
            checkedAt: new Date()
        });


        // 13. Return successful response
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

        // MongoDB unique index protection
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Habit already checked in for this date"
            });
        }

        console.log(error);

        return res.status(500).json({
            message: "Error occurred",
            error: error.message
        });
    }
};


// =========================
// GET HABIT STATS
// =========================
export const getHabitStats = async (req, res) => {
    try {

        // 1. Find habit belonging to current user
        const habit = await Habit.findOne({
            _id: req.params.id,
            owner: req.user
        });

        if (!habit) {
            return res.status(404).json({
                message: "Habit not found"
            });
        }


        // 2. Get all check-ins for this habit
        const checkIns = await CheckIn.find({
            habit: habit._id
        }).sort({
            localDate: 1
        });


        // 3. No check-ins
        if (checkIns.length === 0) {
            return res.status(200).json({
                currentStreak: 0,
                longestStreak: 0
            });
        }


        // 4. Extract only the dates
        const dates = checkIns.map(
            checkIn => checkIn.localDate
        );


        // 5. Calculate longest streak
        let streak = 1;
        let longestStreak = 1;

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


        // 6. Get user's timezone
        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        // 7. Calculate today's local date
        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: user.timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());


        // 8. Last check-in date
        const lastCheckInDate = dates[dates.length - 1];


        // 9. Calculate current streak
        let currentStreak = 0;

        if (lastCheckInDate === today) {
            currentStreak = streak;
        }


        // 10. Return stats
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