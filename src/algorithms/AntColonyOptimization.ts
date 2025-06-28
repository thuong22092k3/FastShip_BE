// import { IDiaDiem } from "../interfaces/DiaDiem";

// export class AntColonyOptimization {
//   constructor(
//     private locations: IDiaDiem[],
//     private distanceMatrix: number[][],
//     private antCount = 20,
//     private iterations = 100,
//     private alpha = 1,
//     private beta = 2,
//     private evaporationRate = 0.5,
//     private Q = 100
//   ) {
//     this.pheromone = Array.from({ length: locations.length }, () =>
//       Array(locations.length).fill(1)
//     );
//   }

//   private pheromone: number[][];

//   selectNextNode(currentNode: number, visitedNodes: Set<number>): number {
//     let total = 0;
//     const probabilities: { node: number; probability: number }[] = [];

//     for (let i = 0; i < this.locations.length; i++) {
//       if (!visitedNodes.has(i)) {
//         const pheromone = Math.pow(this.pheromone[currentNode][i], this.alpha);
//         const heuristic = Math.pow(
//           1 / (this.distanceMatrix[currentNode][i] + 1e-6),
//           this.beta
//         );
//         probabilities.push({ node: i, probability: pheromone * heuristic });
//         total += pheromone * heuristic;
//       }
//     }

//     let rand = Math.random() * total;
//     for (const { node, probability } of probabilities) {
//       rand -= probability;
//       if (rand <= 0) return node;
//     }
//     return probabilities[0].node;
//   }

//   run(initialRoute: number[]): number[] {
//     let bestRoute = initialRoute;

//     for (let iter = 0; iter < this.iterations; iter++) {
//       const newRoute: number[] = [initialRoute[0]];
//       const visited = new Set<number>(newRoute);

//       while (newRoute.length < this.locations.length) {
//         newRoute.push(
//           this.selectNextNode(newRoute[newRoute.length - 1], visited)
//         );
//       }

//       bestRoute = newRoute;
//     }

//     return bestRoute;
//   }
// }
import { IDiaDiem } from "../interfaces/DiaDiem";

export class AntColonyOptimization {
  constructor(
    private locations: IDiaDiem[],
    private distanceMatrix: number[][],
    private startIdx: number,
    private endIdx: number,
    private antCount = 30,
    private iterations = 50,
    private alpha = 1, // Trọng số pheromone
    private beta = 3, // Trọng số heuristic
    private evaporationRate = 0.4,
    private Q = 100, // Hằng số pheromone
    private initialPheromone = 1.0
  ) {
    this.pheromone = Array.from({ length: locations.length }, () =>
      Array(locations.length).fill(initialPheromone)
    );
  }

  private pheromone: number[][];

  selectNextNode(currentNode: number, visitedNodes: Set<number>): number {
    const availableNodes = this.locations
      .map((_, idx) => idx)
      .filter((idx) => !visitedNodes.has(idx) && idx !== this.endIdx);

    if (availableNodes.length === 0) {
      return this.endIdx;
    }

    // Tính toán xác suất cho các node có thể đi tiếp
    const probabilities: { node: number; probability: number }[] = [];
    let total = 0;

    for (const node of availableNodes) {
      const pheromone = Math.pow(this.pheromone[currentNode][node], this.alpha);
      const heuristic = Math.pow(
        1 / (this.distanceMatrix[currentNode][node] + 1e-6),
        this.beta
      );
      const probability = pheromone * heuristic;
      probabilities.push({ node, probability });
      total += probability;
    }

    // Chọn node dựa trên xác suất
    let rand = Math.random() * total;
    for (const { node, probability } of probabilities) {
      rand -= probability;
      if (rand <= 0) return node;
    }

    return availableNodes[0];
  }

  run(initialRoute: number[]): number[] {
    let bestRoute = initialRoute;
    let bestDistance = this.evaluateRoute(bestRoute);

    for (let iter = 0; iter < this.iterations; iter++) {
      const antRoutes: number[][] = [];

      for (let ant = 0; ant < this.antCount; ant++) {
        const route = [this.startIdx];
        const visited = new Set<number>([this.startIdx]);

        // Xây dựng tuyến đường
        while (
          route[route.length - 1] !== this.endIdx &&
          route.length < this.locations.length
        ) {
          const nextNode = this.selectNextNode(
            route[route.length - 1],
            visited
          );
          route.push(nextNode);
          visited.add(nextNode);
        }

        // Đảm bảo route kết thúc tại endIdx
        if (route[route.length - 1] !== this.endIdx) {
          route.push(this.endIdx);
        }

        antRoutes.push(route);

        // Cập nhật tuyến tốt nhất
        const currentDistance = this.evaluateRoute(route);
        if (currentDistance < bestDistance) {
          bestDistance = currentDistance;
          bestRoute = route;
        }
      }

      // Cập nhật pheromone
      this.updatePheromone(antRoutes);
    }

    return bestRoute;
  }

  private evaluateRoute(route: number[]): number {
    let distance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      distance += this.distanceMatrix[route[i]][route[i + 1]];
    }
    return distance;
  }

  private updatePheromone(routes: number[][]): void {
    // Bốc hơi pheromone
    for (let i = 0; i < this.locations.length; i++) {
      for (let j = 0; j < this.locations.length; j++) {
        this.pheromone[i][j] *= 1 - this.evaporationRate;
      }
    }

    // Thêm pheromone mới
    for (const route of routes) {
      const routeDistance = this.evaluateRoute(route);
      const pheromoneToAdd = this.Q / routeDistance;

      for (let i = 0; i < route.length - 1; i++) {
        this.pheromone[route[i]][route[i + 1]] += pheromoneToAdd;
      }
    }
  }
}
