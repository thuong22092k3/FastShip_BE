// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import mongoose from "mongoose";
// import { AntColonyOptimization } from "./algorithms/AntColonyOptimization";
// import { GeneticAlgorithm } from "./algorithms/GeneticAlgorithm";
// import { createDistanceMatrix } from "./algorithms/KhoangCach";
// import { RouteConstraints } from "./controllers/OptimizationController";
// import DiaDiemModel from "./models/DiaDiem";
// import router from "./routes/Routes";
// dotenv.config();

// const app = express();

// app.use(
//   cors({
//     origin: ["http://localhost:3000", "https://fastship-be.onrender.com"],
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use("/api", router);

// const PORT = process.env.PORT || 5000;

// mongoose
//   .connect(
//     "mongodb+srv://admin:admin@fastship.l23v2.mongodb.net/FastShip?retryWrites=true&w=majority&appName=FastShip"
//   )
//   .then(async () => {
//     app.listen(PORT, () => {
//       console.log("server running on PORT" + PORT);
//     });
//     try {
//       const locations = await DiaDiemModel.find().lean();
//       if (!locations || locations.length === 0) {
//         console.error("Không tìm thấy dữ liệu locations");
//         return;
//       }

//       const distanceMatrix = createDistanceMatrix(locations);

//       // const ga = new GeneticAlgorithm(locations, distanceMatrix);
//       // const initialRoute = ga.run();

//       // const aco = new AntColonyOptimization(locations, distanceMatrix);
//       // const optimizedRoute = aco.run(initialRoute);

//       const startIdx = 0;
//       const endIdx = locations.length - 1;

//       const isSameProvince =
//         locations[startIdx].province === locations[endIdx].province;
//       const isSameDistrict =
//         isSameProvince &&
//         locations[startIdx].district === locations[endIdx].district;

//       const constraints: RouteConstraints = {
//         maxStops: isSameDistrict ? 2 : isSameProvince ? 3 : 5,
//         maxTransitHubs: isSameProvince ? 0 : 1,
//         maxSameDistrictStops: isSameDistrict ? 0 : 1,
//       };

//       const ga = new GeneticAlgorithm(
//         locations,
//         distanceMatrix,
//         startIdx,
//         endIdx,
//         constraints
//       );

//       const intermediatePoints = locations
//         .map((_, idx) => idx)
//         .filter((idx) => idx !== startIdx && idx !== endIdx);

//       const gaRoute = ga.run(intermediatePoints);

//       const aco = new AntColonyOptimization(
//         locations,
//         distanceMatrix,
//         startIdx,
//         endIdx,
//         constraints
//       );

//       const optimizedRoute = aco.run(gaRoute);
//       console.log("Lộ trình tối ưu:", optimizedRoute);
//     } catch (err) {
//       console.error("Lỗi khi chạy thuật toán:", err);
//     }
//   })
//   .catch((err) => {
//     process.exit(1);
//   });

// // setTimeout(() => {
// //   const ga = new GeneticAlgorithm();
// //   const initialRoute = ga.run();

// //   const aco = new AntColonyOptimization();
// //   const optimizedRoute = aco.run(initialRoute);
// //   console.log("Lộ trình tối ưu:", optimizedRoute);
// // }, 1000);

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import router from "./routes/Routes";

dotenv.config();

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

const PORT = process.env.PORT || 5000;

mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb+srv://admin:admin@fastship.l23v2.mongodb.net/FastShip?retryWrites=true&w=majority&appName=FastShip"
  )
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server is running on PORT ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

export default app;
