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
                $cond: [{ $eq: ["$TrangThai", "Hoàn thành"] }, 1, 0],
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
                $cond: [{ $eq: ["$TrangThai", "Hoàn thành"] }, 1, 0],
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
};
