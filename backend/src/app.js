import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRouter from "./routes/auth.routes.js";
import habitRouter from "./routes/habit.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

const port = process.env.PORT || 3000;

app.use("/api/auth", authRouter);
app.use("/api/habits", habitRouter);

export { app, port };