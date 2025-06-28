import { IDiaDiem } from "../interfaces/DiaDiem";

export class AntColonyOptimization {
  constructor(
    private locations: IDiaDiem[],
    private distanceMatrix: number[][],
    private startIdx: number,
    private endIdx: number,
    private antCount = 30,
    private iterations = 50,
    private alpha = 1,
    private beta = 3,
    private evaporationRate = 0.4,
    private Q = 100,
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

        if (route[route.length - 1] !== this.endIdx) {
          route.push(this.endIdx);
        }

        antRoutes.push(route);

        const currentDistance = this.evaluateRoute(route);
        if (currentDistance < bestDistance) {
          bestDistance = currentDistance;
          bestRoute = route;
        }
      }

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
    for (let i = 0; i < this.locations.length; i++) {
      for (let j = 0; j < this.locations.length; j++) {
        this.pheromone[i][j] *= 1 - this.evaporationRate;
      }
    }

    for (const route of routes) {
      const routeDistance = this.evaluateRoute(route);
      const pheromoneToAdd = this.Q / routeDistance;

      for (let i = 0; i < route.length - 1; i++) {
        this.pheromone[route[i]][route[i + 1]] += pheromoneToAdd;
      }
    }
  }
}
