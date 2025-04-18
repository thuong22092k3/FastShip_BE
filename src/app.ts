import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import router from "./routes/Routes";
import { GeneticAlgorithm } from "./algorithms/GeneticAlgorithm";
import { AntColonyOptimization } from "./algorithms/AntColonyOptimization";

const app = express();
const port = process.env.PORT as string;
const mongoUri = process.env.MONGO_URI as string;

app.use(express.json());
app.use("/api", router);

mongoose
  .connect(
    "mongodb+srv://admin:admin@fastship.l23v2.mongodb.net/FastShip?retryWrites=true&w=majority&appName=FastShip"
  )
  .then(() => {
    app.listen(3000, () => {
      console.log("server running on port" + port);
    });
  });

const ga = new GeneticAlgorithm();
const initialRoute = ga.run();

const aco = new AntColonyOptimization();
const optimizedRoute = aco.run(initialRoute);
console.log("Lộ trình tối ưu:", optimizedRoute);
