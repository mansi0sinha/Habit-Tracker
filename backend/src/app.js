import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRouter from "./routes/auth.routes.js";
import habitRouter from "./routes/habit.routes.js";
import aiRoutes from "./routes/ai.routes.js";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());

const port = process.env.PORT || 3000;
app.get("/api/health", (req, res) => {
  res.send("Habit Tracker API is running");
});
app.use("/api/auth", authRouter);
app.use("/api/habits", habitRouter);
app.use("/api/ai", aiRoutes);
export { app, port };