import { Request, Response } from "express";
import { AntColonyOptimization } from "../algorithms/AntColonyOptimization";
import { locations } from "../algorithms/Data";
import { GeneticAlgorithm } from "../algorithms/GeneticAlgorithm";
import { createDistanceMatrix } from "../algorithms/KhoangCach";

const distanceMatrix = createDistanceMatrix(locations);

function calculateEstimatedTime(distance: number): string {
  const averageSpeed = 40; // km/h
  const hours = distance / averageSpeed;
  return `${Math.round(hours * 10) / 10} giờ`;
}

function combineAlgorithms(initialRoute: number[]) {
  const ga = new GeneticAlgorithm();
  const gaRoute = ga.run(initialRoute);

  const aco = new AntColonyOptimization();
  const optimizedRoute = aco.run(gaRoute);

  let totalDistance = 0;
  const stops = optimizedRoute.map((index: number) => ({
    id: locations[index].DiaDiemId,
    name: locations[index].name,
    address: locations[index].address,
    coordinates: [locations[index].longitude, locations[index].latitude],
  }));

  for (let i = 0; i < optimizedRoute.length - 1; i++) {
    totalDistance += distanceMatrix[optimizedRoute[i]][optimizedRoute[i + 1]];
  }

  const polyline = optimizedRoute.map((index: number) => [
    locations[index].longitude,
    locations[index].latitude,
  ]);

  return {
    route: optimizedRoute,
    stops,
    totalDistance,
    polyline,
    estimatedTime: calculateEstimatedTime(totalDistance),
  };
}

export const optimizationController = {
  optimizeRoute: async (req: Request, res: Response) => {
    try {
      const { order } = req.body;

      if (!order) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin đơn hàng",
        });
      }

      const initialRoute = Array.from(
        { length: locations.length },
        (_, i) => i
      ).sort(() => Math.random() - 0.5);

      const result = combineAlgorithms(initialRoute);

      res.status(200).json({
        success: true,
        data: {
          ...result,
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
  },
};
