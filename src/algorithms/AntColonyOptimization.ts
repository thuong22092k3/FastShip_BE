import { IDiaDiem } from "../interfaces/DiaDiem";
import { IDonHang } from "../interfaces/DonHang";
import { locations } from "./Data";
import { createDistanceMatrix } from "./KhoangCach";

const distanceMatrix = createDistanceMatrix(locations);

// function printRoute(route: number[], locations: IDiaDiem[]) {
//   console.log("Lộ trình tối ưu:");
//   route.forEach((index, i) => {
//     console.log(
//       `${i + 1}. ${locations[index].name} (${locations[index].latitude}, ${
//         locations[index].longitude
//       })`
//     );
//   });
// }
function printRoute(route: number[], locations: IDiaDiem[], order?: IDonHang) {
  console.log("=== THÔNG TIN BƯU KIỆN ===");
  if (order) {
    console.log(`Mã đơn hàng: ${order.DonHangId}`);
    console.log(`Người gửi: ${order.NguoiGui}`);
    console.log(`Người nhận: ${order.NguoiNhan}`);
    console.log(`Địa chỉ giao: ${order.DiaChiGiaoHang}`);
  }

  console.log("\n=== LỘ TRÌNH TỐI ƯU ===");
  let totalDistance = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const from = locations[route[i]];
    const to = locations[route[i + 1]];
    const distance = distanceMatrix[route[i]][route[i + 1]];
    totalDistance += distance;

    console.log(
      `${i + 1}. Từ ${from.name} (${from.name}) ` +
        `đến ${to.name} (${to.name}) - ` +
        `Khoảng cách: ${distance.toFixed(2)} km`
    );
  }

  console.log(`\nTổng khoảng cách: ${totalDistance.toFixed(2)} km`);
  console.log("=========================");
}

export class AntColonyOptimization {
  antCount: number;
  iterations: number;
  pheromone: number[][];
  alpha: number;
  beta: number;
  evaporationRate: number;
  Q: number;

  constructor(
    antCount = 20,
    iterations = 100,
    alpha = 1,
    beta = 2,
    evaporationRate = 0.5,
    Q = 100
  ) {
    this.antCount = antCount;
    this.iterations = iterations;
    this.alpha = alpha;
    this.beta = beta;
    this.evaporationRate = evaporationRate;
    this.Q = Q;
    this.pheromone = Array.from({ length: locations.length }, () =>
      Array(locations.length).fill(1)
    );
  }

  selectNextNode(currentNode: number, visitedNodes: Set<number>): number {
    let total = 0;
    const probabilities: { node: number; probability: number }[] = [];

    for (let i = 0; i < locations.length; i++) {
      if (!visitedNodes.has(i)) {
        const pheromone = Math.pow(this.pheromone[currentNode][i], this.alpha);
        const heuristic = Math.pow(
          1 / (distanceMatrix[currentNode][i] + 1e-6),
          this.beta
        );
        probabilities.push({ node: i, probability: pheromone * heuristic });
        total += pheromone * heuristic;
      }
    }

    let rand = Math.random() * total;
    for (const { node, probability } of probabilities) {
      rand -= probability;
      if (rand <= 0) return node;
    }
    return probabilities[0].node;
  }

  //   run(initialRoute: number[]): number[] {
  //     let bestRoute = initialRoute;

  //     for (let iter = 0; iter < this.iterations; iter++) {
  //       const newRoute: number[] = [initialRoute[0]];
  //       const visited = new Set<number>(newRoute);

  //       while (newRoute.length < locations.length) {
  //         newRoute.push(
  //           this.selectNextNode(newRoute[newRoute.length - 1], visited)
  //         );
  //       }

  //       bestRoute = newRoute;
  //     }
  //     return bestRoute;
  //   }
  // run(initialRoute: number[]): number[] {
  //   let bestRoute = initialRoute;

  //   for (let iter = 0; iter < this.iterations; iter++) {
  //     const newRoute: number[] = [initialRoute[0]];
  //     const visited = new Set<number>(newRoute);

  //     while (newRoute.length < locations.length) {
  //       newRoute.push(
  //         this.selectNextNode(newRoute[newRoute.length - 1], visited)
  //       );
  //     }

  //     bestRoute = newRoute;
  //   }

  //   printRoute(bestRoute, locations);
  //   return bestRoute;
  // }
  run(initialRoute: number[]): number[] {
    let bestRoute = initialRoute;

    for (let iter = 0; iter < this.iterations; iter++) {
      const newRoute: number[] = [initialRoute[0]];
      const visited = new Set<number>(newRoute);

      while (newRoute.length < locations.length) {
        newRoute.push(
          this.selectNextNode(newRoute[newRoute.length - 1], visited)
        );
      }

      bestRoute = newRoute;
    }

    return bestRoute;
  }
}
