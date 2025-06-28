import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { AntColonyOptimization } from "../algorithms/AntColonyOptimization";
import { locations } from "../algorithms/Data";
import { GeneticAlgorithm } from "../algorithms/GeneticAlgorithm";
import { createDistanceMatrix } from "../algorithms/KhoangCach";
import { IDiaDiem } from "../interfaces/DiaDiem";
import DiaDiemModel from "../models/DiaDiem";
import DonHangModel from "../models/DonHang";

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

      const startLocation = await findNearestLocation(order.DiaChiLayHang);
      const endLocation = await findNearestLocation(order.DiaChiGiaoHang);

      if (!startLocation || !endLocation) {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy bưu cục phù hợp với địa chỉ giao/nhận",
        });
        return;
      }

      const relevantLocations = dbLocations.filter(
        (loc) =>
          loc.province === startLocation.province &&
          loc.province === endLocation.province
      );

      const isSameProvince = startLocation.province === endLocation.province;

      const locationsToUse = isSameProvince
        ? relevantLocations
        : [
            startLocation,
            ...getTransitHubs(startLocation.province, endLocation.province),
            endLocation,
          ];

      const distanceMatrix = createDistanceMatrix(locationsToUse);

      const startIdx = locationsToUse.findIndex(
        (loc) => loc.DiaDiemId === startLocation.DiaDiemId
      );
      const endIdx = locationsToUse.findIndex(
        (loc) => loc.DiaDiemId === endLocation.DiaDiemId
      );

      const intermediatePoints = locationsToUse
        .map((_, idx) => idx)
        .filter((idx) => idx !== startIdx && idx !== endIdx);

      const ga = new GeneticAlgorithm(
        locationsToUse,
        distanceMatrix,
        startIdx,
        endIdx
      );
      const gaRoute = ga.run(intermediatePoints);

      const aco = new AntColonyOptimization(
        locationsToUse,
        distanceMatrix,
        startIdx,
        endIdx
      );
      const optimizedRoute = aco.run(gaRoute);

      let totalDistance = 0;
      const stops = optimizedRoute.map((index: number) => {
        const location = locationsToUse[index];
        return {
          id: location.DiaDiemId,
          name: location.name,
          address: location.address,
          coordinates: [location.longitude, location.latitude],
        };
      });

      for (let i = 0; i < optimizedRoute.length - 1; i++) {
        totalDistance +=
          distanceMatrix[optimizedRoute[i]][optimizedRoute[i + 1]];
      }

      const polyline = optimizedRoute.map((index: number) => [
        locationsToUse[index].longitude,
        locationsToUse[index].latitude,
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
      return;
    } catch (error) {
      console.error("Lỗi khi tối ưu lộ trình:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tối ưu lộ trình",
      });
      return;
    }
  }),

  getDeliveryRoute: asyncHandler(async (req: Request, res: Response) => {
    try {
      const { orderId } = req.query;
      const order = await DonHangModel.findOne({ DonHangId: orderId });
      if (!order) {
        res.status(404).json({ message: "Không tìm thấy đơn hàng" });
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
          arrivalTime: formatArrivalTime(1),
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

  demoAlgorithms: asyncHandler(async (req: Request, res: Response) => {
    try {
      const demoLocations = locations;

      if (!demoLocations || demoLocations.length === 0) {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy dữ liệu địa điểm",
        });
        return;
      }

      const distanceMatrix = createDistanceMatrix(demoLocations);

      const initialRoute = Array.from(
        { length: demoLocations.length },
        (_, i) => i
      );
      const shuffledRoute = [...initialRoute].sort(() => Math.random() - 0.5);

      const initialDistance = calculateRouteDistance(
        shuffledRoute,
        distanceMatrix
      );

      console.time("Genetic Algorithm");
      const ga = new GeneticAlgorithm(
        demoLocations,
        distanceMatrix,
        0,
        demoLocations.length - 1
      );
      const gaRoute = ga.run(initialRoute.slice(1, -1));
      const gaDistance = calculateRouteDistance(gaRoute, distanceMatrix);
      console.timeEnd("Genetic Algorithm");

      console.time("Ant Colony Optimization");
      const aco = new AntColonyOptimization(
        demoLocations,
        distanceMatrix,
        0,
        demoLocations.length - 1
      );
      const acoRoute = aco.run(gaRoute);
      const acoDistance = calculateRouteDistance(acoRoute, distanceMatrix);
      console.timeEnd("Ant Colony Optimization");

      const result = {
        locations: demoLocations.map((loc) => ({
          id: loc.DiaDiemId,
          name: loc.name,
          address: loc.address,
          coordinates: [loc.longitude, loc.latitude],
        })),
        initialRoute: shuffledRoute,
        initialDistance: initialDistance.toFixed(2) + " km",
        gaRoute,
        gaDistance: gaDistance.toFixed(2) + " km",
        acoRoute,
        acoDistance: acoDistance.toFixed(2) + " km",
        improvement: (initialDistance - acoDistance).toFixed(2) + " km",
        improvementPercentage:
          (((initialDistance - acoDistance) / initialDistance) * 100).toFixed(
            2
          ) + "%",
        polyline: acoRoute.map((index) => [
          demoLocations[index].longitude,
          demoLocations[index].latitude,
        ]),
        estimatedTime: calculateEstimatedTime(acoDistance),
      };

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Lỗi khi demo giải thuật:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi demo giải thuật",
      });
    }
  }),
};

// async function findNearestLocation(address: string): Promise<IDiaDiem | null> {
//   return await DiaDiemModel.findOne({
//     address: { $regex: new RegExp(address, "i") },
//   }).lean();
// }

async function findNearestLocation(address: string): Promise<IDiaDiem | null> {
  try {
    const districtMatch = address.match(/(Quận\s+\w+|Q\.\s*\d+)/i);
    const district = districtMatch ? districtMatch[0] : null;

    if (!district) {
      console.error(`Không thể xác định quận từ địa chỉ: ${address}`);
      return null;
    }

    const normalizedDistrict = district
      .replace(/Q\.\s*/i, "Quận ")
      .toLowerCase()
      .trim();

    const location = await DiaDiemModel.findOne({
      $or: [
        { district: { $regex: new RegExp(normalizedDistrict, "i") } },
        { address: { $regex: new RegExp(normalizedDistrict, "i") } },
      ],
    }).lean();

    if (!location) {
      console.error(`Không tìm thấy bưu cục cho quận: ${district}`);
      return null;
    }

    return location as IDiaDiem;
  } catch (error) {
    console.error("Lỗi khi tìm bưu cục gần nhất:", error);
    return null;
  }
}

function formatArrivalTime(hoursToAdd: number): string {
  return new Date(Date.now() + hoursToAdd * 3600000).toLocaleString();
}

function calculateRouteDistance(
  route: number[],
  distanceMatrix: number[][]
): number {
  let distance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    distance += distanceMatrix[route[i]][route[i + 1]];
  }
  return distance;
}

function getTransitHubs(
  startProvince: string,
  endProvince: string
): IDiaDiem[] {
  return [
    {
      DiaDiemId: "HUB_001",
      name: "Trung tâm phân phối miền Nam",
      address: "Khu công nghiệp Sóng Thần, Bình Dương",
      province: "Bình Dương",
      latitude: 11.0041,
      longitude: 106.6584,
    },
    {
      DiaDiemId: "HUB_002",
      name: "Trung tâm phân phối miền Trung",
      address: "Khu công nghiệp Đà Nẵng",
      province: "Đà Nẵng",
      latitude: 16.0544,
      longitude: 108.2022,
    },
  ].filter(
    (hub) => hub.province !== startProvince && hub.province !== endProvince
  );
}
