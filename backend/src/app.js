import express from 'express';
import dotenv from "dotenv";
import testRouter  from "./routes/test.routes.js";
import habitRouter from "./routes/habit.routes.js"
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api',testRouter);
app.use('/api/habits',habitRouter);
app.post('/check', (req, res) => {
    console.log(req.body);
    res.json({
        message: "data received",
        data: req.body
    })
});
app.get('/health', (req, res) => {
    res.send("Habit Tracker API is running");
});
export { app, port };