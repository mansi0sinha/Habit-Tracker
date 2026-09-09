import { z } from "zod";

const habitSchema = z.object({
  name: z.string().trim().min(1, "Habit name is required"),

  description: z.string().trim().optional(),

  category: z.string().default("Health"),

  frequency: z
    .enum(["daily", "weekly"])
    .default("daily"),

  targetDays: z
    .number()
    .min(1)
    .max(7)
    .default(7),

  color: z.string().optional(),

  icon: z.string().optional(),
});

export { habitSchema };