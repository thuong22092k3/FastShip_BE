import { DiaDiem } from "../models/DiaDiem";

export function calculateDistance(a: DiaDiem, b: DiaDiem): number {
  return Math.sqrt(
    Math.pow(a.latitude - b.latitude, 2) +
      Math.pow(a.longitude - b.longitude, 2)
  );
}

export function createDistanceMatrix(locations: Location[]): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < locations.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < locations.length; j++) {
      matrix[i][j] = calculateDistance(locations[i], locations[j]);
    }
  }
  return matrix;
}
