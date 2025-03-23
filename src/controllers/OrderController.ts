import { Response, Request } from "express";
import DonHang from "../models/DonHang";

export const orderController = {
  createOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        NhanVienId,
        NguoiGui,
        NguoiNhan,
        SDT,
        DiaChiLayHang,
        DiaChiGiaoHang,
        CuocPhi,
        TrangThai,
        GhiChu,
      } = req.body;

      if (
        !NguoiGui ||
        !NguoiNhan ||
        !SDT ||
        !DiaChiLayHang ||
        !DiaChiGiaoHang
      ) {
        res
          .status(400)
          .json({ message: "Vui lòng nhập đầy đủ thông tin đơn hàng!" });
        return;
      }

      const newOrder = new DonHang({
        DonHangId: `DH_${Date.now()}`,
        NhanVienId,
        NguoiGui,
        NguoiNhan,
        SDT,
        DiaChiLayHang,
        DiaChiGiaoHang,
        CuocPhi,
        TrangThai: TrangThai || "Chờ xác nhận",
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
        GhiChu,
      });

      await newOrder.save();

      res
        .status(201)
        .json({ message: "Thêm đơn hàng thành công!", order: newOrder });
    } catch (err) {
      console.error("Lỗi thêm đơn hàng:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },
  updateStatusOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.query;
      const { TrangThai } = req.body;

      if (!TrangThai) {
        res.status(400).json({ message: "Vui lòng cung cấp trạng thái mới!" });
        return;
      }

      const updatedOrder = await DonHang.findOneAndUpdate(
        { DonHangId: id },
        { TrangThai, UpdatedAt: new Date() },
        { new: true }
      );

      if (!updatedOrder) {
        res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
        return;
      }

      res.status(200).json({
        message: "Cập nhật trạng thái thành công!",
        order: updatedOrder,
      });
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },
  deleteOrder: async (req: Request, res: Response): Promise<void> => {},
  getOrder: async (req: Request, res: Response): Promise<void> => {},
};
