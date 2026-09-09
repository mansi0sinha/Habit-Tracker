import mongoose from "mongoose";

const HabitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      default: "Health",
    },

    frequency: {
      type: String,
      enum: ["daily", "weekly"],
      default: "daily",
    },

    targetDays: {
      type: Number,
      min: 1,
      max: 7,
      default: 7,
    },

    color: {
      type: String,
    },

    icon: {
      type: String,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Habit = mongoose.model("Habit", HabitSchema);

export default Habit;