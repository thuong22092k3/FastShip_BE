import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { AntColonyOptimization } from "../algorithms/AntColonyOptimization";
import { GeneticAlgorithm } from "../algorithms/GeneticAlgorithm";
import { createDistanceMatrix } from "../algorithms/KhoangCach";
import { IDiaDiem } from "../interfaces/DiaDiem";
import DiaDiemModel from "../models/DiaDiem";
import DonHangModel from "../models/DonHang";

// function calculateEstimatedTime(distance: number): string {
//   const averageSpeed = 40; // km/h
//   const hours = distance / averageSpeed;
//   return `${Math.round(hours * 10) / 10} giờ`;
// }

function calculateTotalDistance(coords: [number, number][]): number {
  let distance = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    distance += haversineDistance(coords[i], coords[i + 1]);
  }
  return distance;
}

function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371; // Earth radius in km
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

function calculateEstimatedTime(distance: number): string {
  const averageSpeed = 40; // km/h
  const hours = distance / averageSpeed;

  if (hours < 1) return `${Math.round(hours * 60)} phút`;
  if (hours < 24) return `${Math.round(hours)} giờ`;
  return `${Math.round(hours / 24)} ngày`;
}

export const optimizationController = {
  optimizeRoute: asyncHandler(async (req: Request, res: Response) => {
    try {
      const { order } = req.body;

      if (!order) {
        res.status(400).json({
          success: false,
          message: "Thiếu thông tin đơn hàng",
        });
        return;
      }

      const dbLocations = (await DiaDiemModel.find().lean()) as IDiaDiem[];
      if (!dbLocations || dbLocations.length === 0) {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy dữ liệu bưu cục",
        });
        return;
      }

      // Tạo ma trận khoảng cách
      const distanceMatrix = createDistanceMatrix(dbLocations);

      const combineAlgorithms = (initialRoute: number[]) => {
        const ga = new GeneticAlgorithm(dbLocations, distanceMatrix);
        const gaRoute = ga.run(initialRoute);

        const aco = new AntColonyOptimization(dbLocations, distanceMatrix);
        return aco.run(gaRoute);
      };

      const initialRoute = Array.from(
        { length: dbLocations.length },
        (_, i) => i
      ).sort(() => Math.random() - 0.5);

      const optimizedRoute = combineAlgorithms(initialRoute);

      // Tính toán kết quả
      let totalDistance = 0;
      const stops = optimizedRoute.map((index: number) => ({
        id: dbLocations[index].DiaDiemId,
        name: dbLocations[index].name,
        address: dbLocations[index].address,
        coordinates: [
          dbLocations[index].longitude,
          dbLocations[index].latitude,
        ],
      }));

      for (let i = 0; i < optimizedRoute.length - 1; i++) {
        totalDistance +=
          distanceMatrix[optimizedRoute[i]][optimizedRoute[i + 1]];
      }

      const polyline = optimizedRoute.map((index: number) => [
        dbLocations[index].longitude,
        dbLocations[index].latitude,
      ]);

      res.status(200).json({
        success: true,
        data: {
          route: optimizedRoute,
          stops,
          totalDistance,
          polyline,
          estimatedTime: calculateEstimatedTime(totalDistance),
          order,
        },
      });
    } catch (error) {
      console.error("Lỗi khi tối ưu lộ trình:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tối ưu lộ trình",
      });
    }
  }),

  getDeliveryRoute: asyncHandler(async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      const order = await DonHangModel.findById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      const pickupLocation = await findNearestLocation(order.DiaChiLayHang);
      const deliveryLocation = await findNearestLocation(order.DiaChiGiaoHang);

      if (!pickupLocation || !deliveryLocation) {
        res.status(404).json({ message: "Không tìm thấy bưu cục phù hợp" });
        return;
      }

      const transitLocation = await DiaDiemModel.findOne({
        province: deliveryLocation.province,
        district: { $ne: deliveryLocation.district },
      });

      const stops = [
        {
          name: `Bưu cục ${pickupLocation.district}`,
          address: pickupLocation.address,
          longitude: pickupLocation.longitude,
          latitude: pickupLocation.latitude,
          arrivalTime: formatArrivalTime(1), // +1 giờ
          type: "pickup",
        },
        {
          name: `Bưu cục trung chuyển ${deliveryLocation.province}`,
          address: transitLocation?.address || "Bưu cục trung chuyển tỉnh",
          longitude:
            transitLocation?.longitude ||
            (pickupLocation.longitude + deliveryLocation.longitude) / 2,
          latitude:
            transitLocation?.latitude ||
            (pickupLocation.latitude + deliveryLocation.latitude) / 2,
          arrivalTime: formatArrivalTime(24),
          type: "transit",
        },
        {
          name: `Bưu cục ${deliveryLocation.district}`,
          address: deliveryLocation.address,
          longitude: deliveryLocation.longitude,
          latitude: deliveryLocation.latitude,
          arrivalTime: formatArrivalTime(48),
          type: "delivery",
        },
      ];

      const polyline: [number, number][] = stops.map(
        (stop) => [stop.longitude, stop.latitude] as [number, number]
      );

      const totalDistance = calculateTotalDistance(polyline);
      const estimatedTime = calculateEstimatedTime(totalDistance);

      res.status(200).json({
        success: true,
        data: {
          stops,
          polyline,
          totalDistance,
          estimatedTime,
        },
      });
    } catch (error) {
      console.error("Error getting delivery route:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }),
};

async function findNearestLocation(address: string): Promise<IDiaDiem | null> {
  return await DiaDiemModel.findOne({
    address: { $regex: new RegExp(address, "i") },
  }).lean();
}

function formatArrivalTime(hoursToAdd: number): string {
  return new Date(Date.now() + hoursToAdd * 3600000).toLocaleString();
}
