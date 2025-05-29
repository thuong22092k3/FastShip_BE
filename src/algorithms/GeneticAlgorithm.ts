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
export class GeneticAlgorithm {
  populationSize: number;
  mutationRate: number;
  generations: number;
  population: number[][];

  constructor(
    populationSize: number = 100,
    mutationRate: number = 0.05,
    generations: number = 200
  ) {
    this.populationSize = populationSize;
    this.mutationRate = mutationRate;
    this.generations = generations;
    this.population = [];
  }

  createIndividual(): number[] {
    const route = Array.from({ length: locations.length }, (_, i) => i);
    for (let i = route.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [route[i], route[j]] = [route[j], route[i]];
    }
    return route;
  }

  evaluate(route: number[]): number {
    let distance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      distance += distanceMatrix[route[i]][route[i + 1]];
    }
    return distance;
  }

  select(): number[] {
    return [...this.population].sort(
      (a, b) => this.evaluate(a) - this.evaluate(b)
    )[0];
  }

  crossover(parent1: number[], parent2: number[]): number[] {
    const start = Math.floor(Math.random() * parent1.length);
    const end = Math.floor(Math.random() * (parent1.length - start)) + start;
    const child = new Array(parent1.length).fill(null);

    for (let i = start; i < end; i++) {
      child[i] = parent1[i];
    }

    let index = 0;
    for (const gene of parent2) {
      if (!child.includes(gene)) {
        while (child[index] !== null) index++;
        child[index] = gene;
      }
    }
    return child;
  }

  mutate(route: number[]): void {
    if (Math.random() < this.mutationRate) {
      const i = Math.floor(Math.random() * route.length);
      const j = Math.floor(Math.random() * route.length);
      [route[i], route[j]] = [route[j], route[i]];
    }
  }

  // run(): number[] {
  //   this.population = Array.from({ length: this.populationSize }, () =>
  //     this.createIndividual()
  //   );

  //   for (let gen = 0; gen < this.generations; gen++) {
  //     const newPopulation: number[][] = [];
  //     for (let i = 0; i < this.populationSize; i++) {
  //       const parent1 = this.select();
  //       const parent2 = this.select();
  //       let child = this.crossover(parent1, parent2);
  //       this.mutate(child);
  //       newPopulation.push(child);
  //     }
  //     this.population = newPopulation;
  //   }

  //   const bestRoute = this.select();
  //   printRoute(bestRoute, locations);
  //   return bestRoute;
  // }
  run(initialRoute?: number[]): number[] {
    this.population = initialRoute
      ? [
          initialRoute,
          ...Array.from({ length: this.populationSize - 1 }, () =>
            this.createIndividual()
          ),
        ]
      : Array.from({ length: this.populationSize }, () =>
          this.createIndividual()
        );

    for (let gen = 0; gen < this.generations; gen++) {
      const newPopulation: number[][] = [];
      for (let i = 0; i < this.populationSize; i++) {
        const parent1 = this.select();
        const parent2 = this.select();
        let child = this.crossover(parent1, parent2);
        this.mutate(child);
        newPopulation.push(child);
      }
      this.population = newPopulation;
    }

    const bestRoute = this.select();
    return bestRoute;
  }
}
