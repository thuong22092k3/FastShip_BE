import { RouteConstraints } from "../controllers/OptimizationController";
import { IDiaDiem } from "../interfaces/DiaDiem";

export class GeneticAlgorithm {
  private population: number[][];

  constructor(
    private locations: IDiaDiem[],
    private distanceMatrix: number[][],
    private startIdx: number,
    private endIdx: number,
    private constraints: RouteConstraints,
    private populationSize: number = 50,
    private mutationRate: number = 0.1,
    private generations: number = 100,
    private elitismCount: number = 2
  ) {
    this.population = [];
  }

  private isValidRoute(route: number[]): boolean {
    if (route.length > this.constraints.maxStops) {
      return false;
    }

    if (route[0] !== this.startIdx || route[route.length - 1] !== this.endIdx) {
      return false;
    }

    return true;
  }

  // createIndividual(intermediatePoints: number[]): number[] {
  //   const route = [...intermediatePoints].sort(() => Math.random() - 0.5);
  //   return [this.startIdx, ...route, this.endIdx];
  // }

  createIndividual(intermediatePoints: number[]): number[] {
    const maxIntermediate = this.constraints.maxStops - 2;
    const limitedPoints = intermediatePoints.slice(0, maxIntermediate);

    const shuffled = [...limitedPoints].sort(() => Math.random() - 0.5);

    return [this.startIdx, ...shuffled, this.endIdx];
  }

  evaluate(route: number[]): number {
    if (!this.isValidRoute(route)) {
      return Infinity;
    }

    let distance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      distance += this.distanceMatrix[route[i]][route[i + 1]];
    }

    const stopPenalty =
      Math.max(0, this.constraints.maxStops - 2 - (route.length - 2)) * 10;

    return distance + stopPenalty;
  }

  // evaluate(route: number[]): number {
  //   let distance = 0;
  //   for (let i = 0; i < route.length - 1; i++) {
  //     distance += this.distanceMatrix[route[i]][route[i + 1]];
  //   }
  //   return distance;
  // }

  select(): number[] {
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
    const start = Math.floor(Math.random() * (parent1.length - 2)) + 1;
    const end =
      Math.floor(Math.random() * (parent1.length - start - 1)) + start;

    const child = new Array(parent1.length).fill(-1);

    for (let i = start; i <= end; i++) {
      child[i] = parent1[i];
    }

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
    this.population = Array.from({ length: this.populationSize }, () =>
      this.createIndividual(intermediatePoints)
    );

    for (let gen = 0; gen < this.generations; gen++) {
      this.population.sort((a, b) => this.evaluate(a) - this.evaluate(b));

      const newPopulation: number[][] = [];

      for (let i = 0; i < this.elitismCount; i++) {
        newPopulation.push([...this.population[i]]);
      }

      while (newPopulation.length < this.populationSize) {
        const parent1 = this.select();
        const parent2 = this.select();
        let child = this.crossover(parent1, parent2);
        this.mutate(child);

        if (this.isValidRoute(child)) {
          newPopulation.push(child);
        }
      }

      this.population = newPopulation;
    }

    this.population.sort((a, b) => this.evaluate(a) - this.evaluate(b));
    return [...this.population[0]];
  }
}
