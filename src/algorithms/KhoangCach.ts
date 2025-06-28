// import { IDiaDiem } from "../interfaces/DiaDiem";
// export function calculateDistance(a: IDiaDiem, b: IDiaDiem): number {
//   return Math.sqrt(
//     Math.pow(a.latitude - b.latitude, 2) +
//       Math.pow(a.longitude - b.longitude, 2)
//   );
// }

// export function createDistanceMatrix(locations: IDiaDiem[]): number[][] {
//   const matrix: number[][] = [];
//   for (let i = 0; i < locations.length; i++) {
//     matrix[i] = [];
//     for (let j = 0; j < locations.length; j++) {
//       matrix[i][j] = calculateDistance(locations[i], locations[j]);
//     }
//   }
//   return matrix;
// }
import { IDiaDiem } from "../interfaces/DiaDiem";

export function createDistanceMatrix(locations: IDiaDiem[]): number[][] {
  const matrix: number[][] = [];
  const size = locations.length;

  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = haversineDistance(
          [locations[i].latitude, locations[i].longitude],
          [locations[j].latitude, locations[j].longitude]
        );
      }
    }
  }

  return matrix;
}

function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371;
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
