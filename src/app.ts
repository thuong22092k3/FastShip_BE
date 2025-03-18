import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import router from "./routes/Routes";

const app = express();
const port = process.env.PORT as string;
const mongoUri = process.env.MONGO_URI as string;

app.use(express.json());
app.use("/api", router);

mongoose.connect(mongoUri).then(() => {
  app.listen(port, () => {
    console.log("server running on port" + port);
  });
});
