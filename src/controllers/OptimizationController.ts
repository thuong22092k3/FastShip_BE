import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { AntColonyOptimization } from "../algorithms/AntColonyOptimization";
import { GeneticAlgorithm } from "../algorithms/GeneticAlgorithm";
import { createDistanceMatrix } from "../algorithms/KhoangCach";
import { IDiaDiem } from "../interfaces/DiaDiem";
import DiaDiemModel from "../models/DiaDiem";
import DonHangModel from "../models/DonHang";
export interface RouteConstraints {
  maxStops: number;
  maxTransitHubs: number;
  maxSameDistrictStops: number;
}

function getRouteConstraints(
  isSameProvince: boolean,
  isSameDistrict: boolean
): RouteConstraints {
  if (isSameDistrict) {
    return {
      maxStops: 2,
      maxTransitHubs: 0,
      maxSameDistrictStops: 0,
    };
  }
  if (isSameProvince) {
    return {
      maxStops: 3,
      maxTransitHubs: 0,
      maxSameDistrictStops: 1,
    };
  }
  return {
    maxStops: 6,
    maxTransitHubs: 1,
    maxSameDistrictStops: 1,
  };
}
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
      console.log("startLocation", startLocation);
      console.log("endLocation", endLocation);

      if (!startLocation || !endLocation) {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy bưu cục phù hợp với địa chỉ giao/nhận",
        });
        return;
      }

      const isSameProvince = startLocation.province === endLocation.province;
      const isSameDistrict =
        isSameProvince && startLocation.district === endLocation.district;
      const constraints = getRouteConstraints(isSameProvince, isSameDistrict);

      let relevantLocations: IDiaDiem[] = [];

      if (isSameDistrict) {
        relevantLocations = [startLocation, endLocation];
      } else if (isSameProvince) {
        relevantLocations = dbLocations
          .filter(
            (loc) =>
              loc.province === startLocation.province &&
              loc.district !== startLocation.district
          )
          .slice(0, constraints.maxSameDistrictStops);
      } else {
        const transitHubs = getTransitHubs(
          startLocation.province,
          endLocation.province
        );
        const startProvinceLocations = dbLocations.filter(
          (loc) => loc.province === startLocation.province
        );
        // .slice(0, 1);

        const endProvinceLocations = dbLocations.filter(
          (loc) => loc.province === endLocation.province
        );
        // .slice(0, 1);
        relevantLocations = [
          ...transitHubs.slice(0, constraints.maxTransitHubs),
          ...startProvinceLocations,
          ...endProvinceLocations,
        ];
      }

      const locationsToUse = [
        startLocation,
        ...relevantLocations,
        endLocation,
      ].filter(
        (loc, index, self) =>
          index === self.findIndex((l) => l.DiaDiemId === loc.DiaDiemId)
      );

      if (locationsToUse.length > constraints.maxStops + 2) {
        locationsToUse.length = constraints.maxStops + 2;
      }

      const distanceMatrix = createDistanceMatrix(locationsToUse);
      const startIdx = 0;
      const endIdx = locationsToUse.length - 1;
      const intermediatePoints = Array.from(
        { length: locationsToUse.length - 2 },
        (_, i) => i + 1
      );

      const ga = new GeneticAlgorithm(
        locationsToUse,
        distanceMatrix,
        startIdx,
        endIdx,
        constraints
      );
      const gaRoute = ga.run(intermediatePoints);
      let gaDistance = 0;
      for (let i = 0; i < gaRoute.length - 1; i++) {
        gaDistance += distanceMatrix[gaRoute[i]][gaRoute[i + 1]];
      }

      const aco = new AntColonyOptimization(
        locationsToUse,
        distanceMatrix,
        startIdx,
        endIdx,
        constraints
      );
      const optimizedRoute = aco.run(gaRoute);
      const acoFromInitialRoute = aco.run(intermediatePoints);

      let acoDistanceFromInitialRoute = 0;
      for (let i = 0; i < acoFromInitialRoute.length - 1; i++) {
        acoDistanceFromInitialRoute +=
          distanceMatrix[acoFromInitialRoute[i]][acoFromInitialRoute[i + 1]];
      }

      let acoDistance = 0;
      for (let i = 0; i < optimizedRoute.length - 1; i++) {
        acoDistance += distanceMatrix[optimizedRoute[i]][optimizedRoute[i + 1]];
      }

      const formatStops = (route: number[]) => {
        return route.map((index: number) => {
          const location = locationsToUse[index];
          return {
            id: location.DiaDiemId,
            name: location.name,
            address: location.address,
            coordinates: [location.longitude, location.latitude],
            type:
              index === startIdx
                ? "pickup"
                : index === endIdx
                ? "delivery"
                : "transit",
          };
        });
      };

      const formatPolyline = (route: number[]) => {
        return route.map((index: number) => [
          locationsToUse[index].longitude,
          locationsToUse[index].latitude,
        ]);
      };

      res.status(200).json({
        success: true,
        data: {
          comparison: {
            ga: {
              route: gaRoute,
              stops: formatStops(gaRoute),
              totalDistance: gaDistance,
              polyline: formatPolyline(gaRoute),
              estimatedTime: calculateEstimatedTime(gaDistance),
            },
            aco: {
              route: acoFromInitialRoute,
              stops: formatStops(acoFromInitialRoute),
              totalDistance: acoDistanceFromInitialRoute,
              polyline: formatPolyline(acoFromInitialRoute),
              estimatedTime: calculateEstimatedTime(
                acoDistanceFromInitialRoute
              ),
            },
            improvement: {
              distance: (gaDistance - acoDistance).toFixed(2),
              percentage: (
                ((gaDistance - acoDistance) / gaDistance) *
                100
              ).toFixed(2),
            },
          },
          optimizedRoute: {
            route: optimizedRoute,
            stops: formatStops(optimizedRoute),
            totalDistance: acoDistance,
            polyline: formatPolyline(optimizedRoute),
            estimatedTime: calculateEstimatedTime(acoDistance),
          },
          constraints,
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
};

async function findNearestLocation(address: string): Promise<IDiaDiem | null> {
  try {
    if (!address || typeof address !== "string") {
      console.error("Địa chỉ không hợp lệ");
      return null;
    }

    const normalizeText = (text: string | undefined) => {
      if (!text) return "";
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s]/g, "");
    };

    const extractLocationInfo = (addr: string) => {
      const patterns = [
        /(?:quận\s+(\w+)|q\.\s*(\d+))/i,
        /(?:huyện\s+(\w+)|h\.\s*(\w+))/i,
        /(?:thành\s+phố\s+(\w+)|tp\.?\s*(\w+))/i,
        /(?:thị\s+xã\s+(\w+)|tx\.?\s*(\w+))/i,
        /(?:tỉnh\s+(\w+)|t\.\s*(\w+))/i,
      ];

      let district = null;
      let province = null;

      for (const pattern of patterns) {
        const match = addr.match(pattern);
        if (match) {
          const extracted = match[1] || match[2];
          if (
            pattern.toString().includes("quận") ||
            pattern.toString().includes("huyện") ||
            pattern.toString().includes("thị xã")
          ) {
            district = extracted;
          } else if (
            pattern.toString().includes("thành phố") ||
            pattern.toString().includes("tỉnh")
          ) {
            province = extracted;
          }
        }
      }

      if (!province) {
        const knownProvinces = {
          "hà nội": "Hà Nội",
          "tp hcm": "TP.HCM",
          "hồ chí minh": "TP.HCM",
          "bình dương": "Bình Dương",
          "đồng nai": "Đồng Nai",
          "đà nẵng": "Đà Nẵng",
        };

        for (const [key, val] of Object.entries(knownProvinces)) {
          if (addr.toLowerCase().includes(key)) {
            province = val;
            break;
          }
        }
      }

      if (!district && !province) {
        const commonDistricts = [
          { pattern: /tân phú/i, value: "Tân Phú" },
          { pattern: /bình tân/i, value: "Bình Tân" },
          { pattern: /gò vấp/i, value: "Gò Vấp" },
        ];

        const commonProvinces = [
          { pattern: /hcm|tphcm|hồ chí minh/i, value: "TP.HCM" },
          { pattern: /hà nội/i, value: "Hà Nội" },
          { pattern: /đồng nai/i, value: "Đồng Nai" },
          { pattern: /bình dương/i, value: "Bình Dương" },
        ];

        for (const item of commonDistricts) {
          if (item.pattern.test(addr)) {
            district = item.value;
            break;
          }
        }

        for (const item of commonProvinces) {
          if (item.pattern.test(addr)) {
            province = item.value;
            break;
          }
        }
      }

      return { district, province };
    };

    const { district, province } = extractLocationInfo(address);
    console.log(
      `Extracted from address: district=${district}, province=${province}`
    );

    if (!district && !province) {
      console.error(
        `Không thể xác định quận/huyện hoặc tỉnh từ địa chỉ: ${address}`
      );
      return null;
    }

    const allLocations = await DiaDiemModel.find().lean();
    if (!allLocations || allLocations.length === 0) {
      console.error("Không có dữ liệu bưu cục");
      return null;
    }

    let potentialLocations = allLocations.filter((loc) => {
      try {
        const locDistrict = normalizeText(loc?.district);
        const locProvince = normalizeText(loc?.province);
        const locAddress = normalizeText(loc?.address);
        const searchDistrict = normalizeText(district || "");
        const searchProvince = normalizeText(province || "");

        const districtMatch = district
          ? locDistrict.includes(searchDistrict) ||
            locAddress.includes(searchDistrict)
          : true;

        const provinceMatch = province
          ? locProvince.includes(searchProvince) ||
            locAddress.includes(searchProvince)
          : true;

        return districtMatch && provinceMatch;
      } catch (err) {
        console.error("Lỗi khi kiểm tra địa điểm:", err);
        return false;
      }
    });

    if (potentialLocations.length === 0 && district) {
      potentialLocations = allLocations.filter((loc) => {
        const locDistrict = normalizeText(loc?.district);
        const searchDistrict = normalizeText(district);
        return locDistrict.includes(searchDistrict.substring(0, 3));
      });
    }

    if (potentialLocations.length === 0 && province) {
      potentialLocations = allLocations.filter((loc) => {
        const locProvince = normalizeText(loc?.province);
        const searchProvince = normalizeText(province);
        return locProvince.includes(searchProvince.substring(0, 3));
      });
    }

    if (potentialLocations.length === 0) {
      console.error(`Không tìm thấy bưu cục phù hợp cho: ${address}`);
      return null;
    }

    const foundLocation = potentialLocations[0] as IDiaDiem;
    console.log(
      `Found location: ${foundLocation.name}, ${foundLocation.district}, ${foundLocation.province}`
    );
    return foundLocation;
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
