import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { AntColonyOptimization } from "../algorithms/AntColonyOptimization";
import { GeneticAlgorithm } from "../algorithms/GeneticAlgorithm";
import { createDistanceMatrix } from "../algorithms/KhoangCach";
import { IDiaDiem } from "../interfaces/DiaDiem";
import DiaDiemModel from "../models/DiaDiem";

function calculateEstimatedTime(distance: number): string {
  const averageSpeed = 40; // km/h
  const hours = distance / averageSpeed;
  return `${Math.round(hours * 10) / 10} giờ`;
}

export const optimizationController = {
  optimizeRoute: asyncHandler(async (req: Request, res: Response) => {
    try {
      const { order } = req.body;

      if (!order) {
        res.status(400).json({
          success: false,
          message: "Thiếu thông tin đơn hàng",
        });
        return;
      }

      const dbLocations = (await DiaDiemModel.find().lean()) as IDiaDiem[];
      if (!dbLocations || dbLocations.length === 0) {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy dữ liệu bưu cục",
        });
        return;
      }

      // Tạo ma trận khoảng cách
      const distanceMatrix = createDistanceMatrix(dbLocations);

      const combineAlgorithms = (initialRoute: number[]) => {
        const ga = new GeneticAlgorithm(dbLocations, distanceMatrix);
        const gaRoute = ga.run(initialRoute);

        const aco = new AntColonyOptimization(dbLocations, distanceMatrix);
        return aco.run(gaRoute);
      };

      const initialRoute = Array.from(
        { length: dbLocations.length },
        (_, i) => i
      ).sort(() => Math.random() - 0.5);

      const optimizedRoute = combineAlgorithms(initialRoute);

      // Tính toán kết quả
      let totalDistance = 0;
      const stops = optimizedRoute.map((index: number) => ({
        id: dbLocations[index].DiaDiemId,
        name: dbLocations[index].name,
        address: dbLocations[index].address,
        coordinates: [
          dbLocations[index].longitude,
          dbLocations[index].latitude,
        ],
      }));

      for (let i = 0; i < optimizedRoute.length - 1; i++) {
        totalDistance +=
          distanceMatrix[optimizedRoute[i]][optimizedRoute[i + 1]];
      }

      const polyline = optimizedRoute.map((index: number) => [
        dbLocations[index].longitude,
        dbLocations[index].latitude,
      ]);

      res.status(200).json({
        success: true,
        data: {
          route: optimizedRoute,
          stops,
          totalDistance,
          polyline,
          estimatedTime: calculateEstimatedTime(totalDistance),
          order,
        },
      });
    } catch (error) {
      console.error("Lỗi khi tối ưu lộ trình:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tối ưu lộ trình",
      });
    }
  }),
};
