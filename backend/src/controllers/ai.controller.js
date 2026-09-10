import gemini from "../gemini.js";
import Habit from "../models/Habit.js";
import CheckIn from "../models/CheckIn.js";

export const generateHabitCoach = async (req, res) => {
  try {
    // 1. Get the logged-in user's habits
    const habits = await Habit.find({
      owner: req.user,
    }).lean();

    // 2. Get check-ins for those habits
    const habitIds = habits.map((habit) => habit._id);

    const checkIns = await CheckIn.find({
      habit: { $in: habitIds },
    })
      .sort({ localDate: -1 })
      .lean();
    // 3. Prepare only the useful data for the AI
    const habitData = habits.map((habit) => {
      const habitCheckIns = checkIns.filter(
        (checkIn) =>
          String(checkIn.habit) === String(habit._id)
      );

      return {
        name: habit.name,
        description: habit.description || "",
        category: habit.category || "Other",
        frequency: habit.frequency,
        checkIns: habitCheckIns.map(
          (checkIn) => checkIn.localDate
        ),
      };
    });

    // 4. Create the AI prompt
    const prompt = `
You are an AI Habit Coach inside a habit tracking application.

Analyze the user's habit data and give practical, personalized advice.

User's habit data:
${JSON.stringify(habitData, null, 2)}

Give the user:
1. A short overall performance summary.
2. Their strongest habit.
3. The habit that needs the most attention.
4. Two practical suggestions for improvement.

Keep the response friendly, encouraging, and concise.
Do not invent data that is not provided.
`;

    // 5. Send the data to Gemini
    const response = await gemini.interactions.create({
      model: "gemini-3.8-flash",
      input: prompt,
    });

    // 6. Send AI response to frontend
    res.json({
      message: response.output_text,
    });
  } catch (error) {
    console.error("AI COACH ERROR:", error);

    res.status(500).json({
      message: "Failed to generate AI habit analysis",
    });
  }
};
