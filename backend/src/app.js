import express from 'express';
import dotenv from "dotenv";
import authRouter  from "./routes/auth.routes.js";
import habitRouter from "./routes/habit.routes.js"
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/habits',habitRouter);


export { app, port };