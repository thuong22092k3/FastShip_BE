// import { IDiaDiem } from "../interfaces/DiaDiem";

// export class GeneticAlgorithm {
//   constructor(
//     private locations: IDiaDiem[],
//     private distanceMatrix: number[][],
//     private populationSize: number = 100,
//     private mutationRate: number = 0.05,
//     private generations: number = 200
//   ) {
//     this.population = [];
//   }

//   private population: number[][];

//   createIndividual(): number[] {
//     const route = Array.from({ length: this.locations.length }, (_, i) => i);
//     for (let i = route.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [route[i], route[j]] = [route[j], route[i]];
//     }
//     return route;
//   }

//   evaluate(route: number[]): number {
//     let distance = 0;
//     for (let i = 0; i < route.length - 1; i++) {
//       distance += this.distanceMatrix[route[i]][route[i + 1]];
//     }
//     return distance;
//   }

//   select(): number[] {
//     return [...this.population].sort(
//       (a, b) => this.evaluate(a) - this.evaluate(b)
//     )[0];
//   }

//   crossover(parent1: number[], parent2: number[]): number[] {
//     const start = Math.floor(Math.random() * parent1.length);
//     const end = Math.floor(Math.random() * (parent1.length - start)) + start;
//     const child = new Array(parent1.length).fill(null);

//     for (let i = start; i < end; i++) {
//       child[i] = parent1[i];
//     }

//     let index = 0;
//     for (const gene of parent2) {
//       if (!child.includes(gene)) {
//         while (child[index] !== null) index++;
//         child[index] = gene;
//       }
//     }
//     return child;
//   }

//   mutate(route: number[]): void {
//     if (Math.random() < this.mutationRate) {
//       const i = Math.floor(Math.random() * route.length);
//       const j = Math.floor(Math.random() * route.length);
//       [route[i], route[j]] = [route[j], route[i]];
//     }
//   }

//   run(initialRoute?: number[]): number[] {
//     this.population = initialRoute
//       ? [
//           initialRoute,
//           ...Array.from({ length: this.populationSize - 1 }, () =>
//             this.createIndividual()
//           ),
//         ]
//       : Array.from({ length: this.populationSize }, () =>
//           this.createIndividual()
//         );

//     for (let gen = 0; gen < this.generations; gen++) {
//       const newPopulation: number[][] = [];
//       for (let i = 0; i < this.populationSize; i++) {
//         const parent1 = this.select();
//         const parent2 = this.select();
//         let child = this.crossover(parent1, parent2);
//         this.mutate(child);
//         newPopulation.push(child);
//       }
//       this.population = newPopulation;
//     }

//     return this.select();
//   }
// }
import { IDiaDiem } from "../interfaces/DiaDiem";

export class GeneticAlgorithm {
  constructor(
    private locations: IDiaDiem[],
    private distanceMatrix: number[][],
    private startIdx: number,
    private endIdx: number,
    private populationSize: number = 50,
    private mutationRate: number = 0.1,
    private generations: number = 100,
    private elitismCount: number = 2
  ) {
    this.population = [];
  }

  private population: number[][];

  createIndividual(intermediatePoints: number[]): number[] {
    // Tạo cá thể với điểm bắt đầu và kết thúc cố định
    const route = [...intermediatePoints].sort(() => Math.random() - 0.5);
    return [this.startIdx, ...route, this.endIdx];
  }

  evaluate(route: number[]): number {
    let distance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      distance += this.distanceMatrix[route[i]][route[i + 1]];
    }
    return distance;
  }

  select(): number[] {
    // Tournament selection
    const tournamentSize = 5;
    const candidates = Array.from(
      { length: tournamentSize },
      () => this.population[Math.floor(Math.random() * this.population.length)]
    );
    return candidates.reduce((best, current) =>
      this.evaluate(current) < this.evaluate(best) ? current : best
    );
  }

  crossover(parent1: number[], parent2: number[]): number[] {
    // Order crossover (OX)
    const start = Math.floor(Math.random() * (parent1.length - 2)) + 1;
    const end =
      Math.floor(Math.random() * (parent1.length - start - 1)) + start;

    const child = new Array(parent1.length).fill(-1);

    // Copy segment from parent1
    for (let i = start; i <= end; i++) {
      child[i] = parent1[i];
    }

    // Fill remaining from parent2
    let currentPos = 1;
    for (const gene of parent2.slice(1, -1)) {
      if (!child.includes(gene)) {
        while (currentPos < child.length - 1 && child[currentPos] !== -1) {
          currentPos++;
        }
        if (currentPos < child.length - 1) {
          child[currentPos] = gene;
        }
      }
    }

    // Ensure start and end are fixed
    child[0] = this.startIdx;
    child[child.length - 1] = this.endIdx;

    return child;
  }

  mutate(route: number[]): void {
    // Swap mutation (only on intermediate points)
    if (Math.random() < this.mutationRate) {
      let i = Math.floor(Math.random() * (route.length - 2)) + 1;
      let j = Math.floor(Math.random() * (route.length - 2)) + 1;
      [route[i], route[j]] = [route[j], route[i]];
    }
  }

  run(intermediatePoints: number[]): number[] {
    // Khởi tạo quần thể
    this.population = Array.from({ length: this.populationSize }, () =>
      this.createIndividual(intermediatePoints)
    );

    for (let gen = 0; gen < this.generations; gen++) {
      // Sắp xếp quần thể theo độ thích nghi
      this.population.sort((a, b) => this.evaluate(a) - this.evaluate(b));

      // Tạo quần thể mới với elitism
      const newPopulation: number[][] = [];

      // Giữ lại các cá thể tốt nhất
      for (let i = 0; i < this.elitismCount; i++) {
        newPopulation.push([...this.population[i]]);
      }

      // Tạo các cá thể mới
      while (newPopulation.length < this.populationSize) {
        const parent1 = this.select();
        const parent2 = this.select();
        let child = this.crossover(parent1, parent2);
        this.mutate(child);
        newPopulation.push(child);
      }

      this.population = newPopulation;
    }

    // Trả về cá thể tốt nhất
    return [...this.population[0]];
  }
}
