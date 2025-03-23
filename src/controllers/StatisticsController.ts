import { Response, Request } from "express";
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
        NhanVienId,
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

      if (NhanVienId) {
        query.NhanVienId = NhanVienId;
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
};
