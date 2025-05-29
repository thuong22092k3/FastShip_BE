import { Request, Response } from "express";
import { IDiaDiem } from "../interfaces/DiaDiem";
import { IDonHang } from "../interfaces/DonHang";
import { GeneticAlgorithm } from "../algorithms/GeneticAlgorithm";
import { AntColonyOptimization } from "../algorithms/AntColonyOptimization";
import { locations } from "../algorithms/Data";
import { createDistanceMatrix } from "../algorithms/KhoangCach";

const distanceMatrix = createDistanceMatrix(locations);

class OptimizationController {
  private combineAlgorithms(initialRoute: number[]): number[] {
    const ga = new GeneticAlgorithm();
    const gaRoute = ga.run(initialRoute);

    const aco = new AntColonyOptimization();
    const optimizedRoute = aco.run(gaRoute);

    return optimizedRoute;
  }

  public optimizeRoute(req: Request, res: Response) {
    try {
      const { order } = req.body;

      // Tạo route ban đầu ngẫu nhiên
      const initialRoute = Array.from(
        { length: locations.length },
        (_, i) => i
      );
      for (let i = initialRoute.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialRoute[i], initialRoute[j]] = [initialRoute[j], initialRoute[i]];
      }

      const optimizedRoute = this.combineAlgorithms(initialRoute);

      let totalDistance = 0;
      for (let i = 0; i < optimizedRoute.length - 1; i++) {
        totalDistance +=
          distanceMatrix[optimizedRoute[i]][optimizedRoute[i + 1]];
      }

      res.status(200).json({
        success: true,
        route: optimizedRoute.map((index) => locations[index]),
        totalDistance: totalDistance.toFixed(2),
        order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi tối ưu lộ trình",
      });
    }
  }
}

export const optimizationController = new OptimizationController();
