import { IDiaDiem } from "../interfaces/DiaDiem";

export class AntColonyOptimization {
  constructor(
    private locations: IDiaDiem[],
    private distanceMatrix: number[][],
    private antCount = 20,
    private iterations = 100,
    private alpha = 1,
    private beta = 2,
    private evaporationRate = 0.5,
    private Q = 100
  ) {
    this.pheromone = Array.from({ length: locations.length }, () =>
      Array(locations.length).fill(1)
    );
  }

  private pheromone: number[][];

  selectNextNode(currentNode: number, visitedNodes: Set<number>): number {
    let total = 0;
    const probabilities: { node: number; probability: number }[] = [];

    for (let i = 0; i < this.locations.length; i++) {
      if (!visitedNodes.has(i)) {
        const pheromone = Math.pow(this.pheromone[currentNode][i], this.alpha);
        const heuristic = Math.pow(
          1 / (this.distanceMatrix[currentNode][i] + 1e-6),
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

  run(initialRoute: number[]): number[] {
    let bestRoute = initialRoute;

    for (let iter = 0; iter < this.iterations; iter++) {
      const newRoute: number[] = [initialRoute[0]];
      const visited = new Set<number>(newRoute);

      while (newRoute.length < this.locations.length) {
        newRoute.push(
          this.selectNextNode(newRoute[newRoute.length - 1], visited)
        );
      }

      bestRoute = newRoute;
    }

    return bestRoute;
  }
}
