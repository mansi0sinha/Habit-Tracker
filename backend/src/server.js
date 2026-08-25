import express from 'express';
import dotenv from "dotenv";
dotenv.config();
const app = express();
const port=process.env.PORT;
app.use(express.json());
app.post('/api/test',(req,res)=>{
console.log(req.body);
res.json({
  message:"data received",
  data:req.body
})
});
app.get('/api/health', (req, res) => {
  res.send("Habit Tracker API is running");
});
app.listen(port, () => {

  console.log(`Server running on port ${port}`);
});