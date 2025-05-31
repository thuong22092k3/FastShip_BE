// import dotenv from "dotenv";
// dotenv.config();
// import express from "express";
// import mongoose from "mongoose";
// import router from "./routes/Routes";
// import { GeneticAlgorithm } from "./algorithms/GeneticAlgorithm";
// import { AntColonyOptimization } from "./algorithms/AntColonyOptimization";

// const app = express();
// const port = process.env.PORT as string;
// const mongoUri = process.env.MONGO_URI as string;

// app.use(express.json());
// app.use("/api", router);

// mongoose
//   .connect(
//     "mongodb+srv://admin:admin@fastship.l23v2.mongodb.net/FastShip?retryWrites=true&w=majority&appName=FastShip"
//   )
//   .then(() => {
//     app.listen(3000, () => {
//       console.log("server running on port" + port);
//     });
//   });

// const ga = new GeneticAlgorithm();
// const initialRoute = ga.run();

// const aco = new AntColonyOptimization();
// const optimizedRoute = aco.run(initialRoute);
// console.log("Lộ trình tối ưu:", optimizedRoute);

import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import router from "./routes/Routes";
import { GeneticAlgorithm } from "./algorithms/GeneticAlgorithm";
import { AntColonyOptimization } from "./algorithms/AntColonyOptimization";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://fastship-be.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/api", router);

mongoose
  .connect(
    "mongodb+srv://admin:admin@fastship.l23v2.mongodb.net/FastShip?retryWrites=true&w=majority&appName=FastShip"
  )
  .then(() => {
    app.listen(5000, () => {
      console.log("server running on port" + 5000);
    });
  })
  .catch((err) => {
    process.exit(1);
  });

setTimeout(() => {
  const ga = new GeneticAlgorithm();
  const initialRoute = ga.run();

  const aco = new AntColonyOptimization();
  const optimizedRoute = aco.run(initialRoute);
  console.log("Lộ trình tối ưu:", optimizedRoute);
}, 1000);
