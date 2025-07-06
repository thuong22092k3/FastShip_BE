// src/controllers/statistics.controller.ts
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { Request, Response } from "express";
import DonHang from "../models/DonHang";

export const statisticsController = {
  statistic: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        fromDate,
        toDate,
        TrangThai,
        DiaChiGiaoHang,
        NguoiGui,
        NhanVienID,
      } = req.query;

      const query: any = {};

      if (fromDate && toDate) {
        query.CreatedAt = {
          $gte: new Date(fromDate as string),
          $lte: new Date(toDate as string),
        };
      }

      if (TrangThai) {
        query.TrangThai = TrangThai;
      }

      if (DiaChiGiaoHang) {
        query.DiaChiGiaoHang = DiaChiGiaoHang;
      }

      if (NguoiGui) {
        query.NguoiGui = NguoiGui;
      }

      if (NhanVienID) {
        query.NhanVienID = NhanVienID;
      }

      const orders = await DonHang.find(query);

      res.status(200).json({
        message: "Thống kê đơn hàng thành công!",
        total: orders.length,
        orders,
      });
    } catch (err) {
      console.error("Lỗi thống kê đơn hàng:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },

  getOverview: async (req: Request, res: Response): Promise<void> => {
    try {
      const today = new Date();
      const startOfCurrentMonth = startOfMonth(today);
      const endOfCurrentMonth = endOfMonth(today);
      const startOfLastMonth = startOfMonth(subMonths(today, 1));
      const endOfLastMonth = endOfMonth(subMonths(today, 1));

      const totalOrders = await DonHang.countDocuments();

      const currentMonthOrders = await DonHang.countDocuments({
        CreatedAt: {
          $gte: startOfCurrentMonth,
          $lte: endOfCurrentMonth,
        },
      });

      const lastMonthOrders = await DonHang.countDocuments({
        CreatedAt: {
          $gte: startOfLastMonth,
          $lte: endOfLastMonth,
        },
      });

      const percentageChange =
        lastMonthOrders > 0
          ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
          : 100;

      const statusStats = await DonHang.aggregate([
        {
          $group: {
            _id: "$TrangThai",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            status: "$_id",
            count: 1,
            _id: 0,
          },
        },
      ]);

      const staffStats = await DonHang.aggregate([
        {
          $group: {
            _id: "$NhanVienID",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 5,
        },
        {
          $project: {
            staffId: "$_id",
            count: 1,
            _id: 0,
          },
        },
      ]);

      const monthlyStats = await DonHang.aggregate([
        {
          $match: {
            CreatedAt: {
              $gte: subMonths(startOfMonth(today), 5),
              $lte: endOfCurrentMonth,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$CreatedAt" },
              month: { $month: "$CreatedAt" },
            },
            count: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $eq: ["$TrangThai", "Đã giao"] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
        {
          $project: {
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: {
                  $dateFromParts: {
                    year: "$_id.year",
                    month: "$_id.month",
                  },
                },
              },
            },
            count: 1,
            completed: 1,
            _id: 0,
          },
        },
      ]);

      res.status(200).json({
        message: "Thống kê tổng quan thành công!",
        data: {
          totalOrders,
          currentMonthOrders,
          percentageChange: percentageChange.toFixed(2),
          statusStats,
          staffStats,
          monthlyStats,
        },
      });
    } catch (err) {
      console.error("Lỗi thống kê tổng quan:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },

  getLocationStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const locationStats = await DonHang.aggregate([
        {
          $group: {
            _id: "$DiaChiGiaoHang",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            address: "$_id",
            count: 1,
            _id: 0,
          },
        },
      ]);

      res.status(200).json({
        message: "Thống kê theo địa chỉ thành công!",
        data: locationStats,
      });
    } catch (err) {
      console.error("Lỗi thống kê theo địa chỉ:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },

  getStaffPerformance: async (req: Request, res: Response): Promise<void> => {
    try {
      const staffPerformance = await DonHang.aggregate([
        {
          $group: {
            _id: "$NhanVienID",
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ["$TrangThai", "Đã giao"] }, 1, 0],
              },
            },
            avgProcessingTime: {
              $avg: {
                $subtract: ["$NgayGiaoHang", "$CreatedAt"],
              },
            },
          },
        },
        {
          $sort: { completedOrders: -1 },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            staffId: "$_id",
            totalOrders: 1,
            completedOrders: 1,
            completionRate: {
              $multiply: [
                { $divide: ["$completedOrders", "$totalOrders"] },
                100,
              ],
            },
            avgProcessingTime: 1,
            _id: 0,
          },
        },
      ]);

      res.status(200).json({
        message: "Thống kê hiệu suất nhân viên thành công!",
        data: staffPerformance,
      });
    } catch (err) {
      console.error("Lỗi thống kê hiệu suất nhân viên:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },
  filterOrders: async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromDate, toDate, TrangThai, DiaChiGiaoHang, NhanVienID } =
        req.query;

      const query: any = {};

      if (fromDate && toDate) {
        query.CreatedAt = {
          $gte: new Date(fromDate as string),
          $lte: new Date(toDate as string),
        };
      }

      if (TrangThai) {
        query.TrangThai = TrangThai;
      }

      if (DiaChiGiaoHang) {
        query.DiaChiGiaoHang = DiaChiGiaoHang;
      }

      if (NhanVienID) {
        query.NhanVienID = NhanVienID;
      }

      const orders = await DonHang.find(query).lean();

      res.status(200).json({
        message: "Filter orders successfully!",
        data: orders,
      });
    } catch (err) {
      console.error("Error filtering orders:", err);
      res.status(500).json({ message: "System error" });
    }
  },

  getMonthlyStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const today = new Date();
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      // Debug: Log khoảng thời gian query
      console.log("Query range:", {
        start: sixMonthsAgo,
        end: endOfDay,
      });

      // Lấy dữ liệu từ database
      const orders = await DonHang.find({
        CreatedAt: {
          $gte: sixMonthsAgo,
          $lte: endOfDay,
        },
      }).lean();

      // Debug: Log số lượng đơn hàng tìm thấy
      console.log(`Found ${orders.length} orders in date range`);

      // Tạo object để nhóm dữ liệu theo tháng
      const monthlyData: Record<string, { count: number; completed: number }> =
        {};

      orders.forEach((order) => {
        const orderDate = new Date(order.CreatedAt);
        const monthKey = `${orderDate.getFullYear()}-${String(
          orderDate.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { count: 0, completed: 0 };
        }

        monthlyData[monthKey].count++;
        if (order.TrangThai === "Đã giao") {
          monthlyData[monthKey].completed++;
        }
      });

      // Tạo mảng kết quả cho 6 tháng gần nhất
      const result = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        result.push({
          month: monthKey,
          count: monthlyData[monthKey]?.count || 0,
          completed: monthlyData[monthKey]?.completed || 0,
        });
      }

      // Debug: Log kết quả cuối cùng
      console.log("Monthly stats result:", result);

      res.status(200).json({
        message: "Monthly stats fetched successfully!",
        data: result,
      });
    } catch (err) {
      console.error("Error fetching monthly stats:", err);
      res.status(500).json({ message: "System error" });
    }
  },

  getStatusStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await DonHang.aggregate([
        {
          $group: {
            _id: "$TrangThai",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            status: "$_id",
            count: 1,
            _id: 0,
          },
        },
      ]);

      res.status(200).json({
        message: "Status stats fetched successfully!",
        data: stats,
      });
    } catch (err) {
      console.error("Error fetching status stats:", err);
      res.status(500).json({ message: "System error" });
    }
  },

  getTopStaff: async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;

      const stats = await DonHang.aggregate([
        {
          $group: {
            _id: "$NhanVienID",
            count: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $eq: ["$TrangThai", "Đã giao"] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            staffId: "$_id",
            totalOrders: "$count",
            completedOrders: "$completed",
            completionRate: {
              $multiply: [{ $divide: ["$completed", "$count"] }, 100],
            },
            _id: 0,
          },
        },
      ]);

      res.status(200).json({
        message: "Top staff fetched successfully!",
        data: stats,
      });
    } catch (err) {
      console.error("Error fetching top staff:", err);
      res.status(500).json({ message: "System error" });
    }
  },
};
