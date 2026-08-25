import { app, port } from './app.js';
import connectDB from './config/db.js';
const startServer = async () => {
  await connectDB();

  app.listen(port, () => {

    console.log(`Server running on port ${port}`);
  });
};
startServer();
