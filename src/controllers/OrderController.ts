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
  // updateStatusOrder: async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     // Đọc từ query thay vì params
  //     const { id } = req.query;
  //     const { TrangThai } = req.body;

  //     if (!id) {
  //       res.status(400).json({ message: "Vui lòng cung cấp ID đơn hàng!" });
  //       return;
  //     }

  //     if (!TrangThai) {
  //       res.status(400).json({ message: "Vui lòng cung cấp trạng thái mới!" });
  //       return;
  //     }

  //     const updatedOrder = await DonHang.findOneAndUpdate(
  //       { DonHangId: id },
  //       { TrangThai, UpdatedAt: new Date() },
  //       { new: true }
  //     );

  //     if (!updatedOrder) {
  //       res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
  //       return;
  //     }

  //     res.status(200).json({
  //       message: "Cập nhật trạng thái thành công!",
  //       order: updatedOrder,
  //     });
  //   } catch (err) {
  //     console.error("Lỗi cập nhật trạng thái:", err);
  //     res.status(500).json({ message: "Lỗi hệ thống" });
  //   }
  // },
  updateStatusOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.query;
      const { TrangThai } = req.body;

      const orderExists = await DonHang.findOne({ DonHangId: id });
      console.log("Debug - Đơn hàng tìm thấy:", orderExists);

      if (!id) {
        res.status(400).json({ message: "Vui lòng cung cấp ID đơn hàng!" });
        return;
      }

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
  deleteOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.query;

      const deletedOrder = await DonHang.findOneAndDelete({ DonHangId: id });

      if (!deletedOrder) {
        res.status(404).json({ message: "Không tìm thấy đơn hàng để xóa!" });
        return;
      }

      res
        .status(200)
        .json({ message: "Xóa đơn hàng thành công!", order: deletedOrder });
    } catch (err) {
      console.error("Lỗi xóa đơn hàng:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },
  getOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.query;

      if (id) {
        const order = await DonHang.find();

        if (!order) {
          res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
          return;
        }

        res.status(200).json({ order });
      } else {
        const orders = await DonHang.find();
        res.status(200).json({ orders });
      }
    } catch (err) {
      console.error("Lỗi lấy đơn hàng:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },
  getOrderDetail: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("URL được gọi:", req.originalUrl);
      console.log("Query parameters:", req.query);
      const { donHangId } = req.query;

      if (!donHangId) {
        res.status(400).json({ message: "Vui lòng cung cấp ID đơn hàng!" });
        return;
      }

      const order = await DonHang.findOne({ DonHangId: donHangId });

      if (!order) {
        res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
        return;
      }

      res.status(200).json({
        message: "Lấy thông tin đơn hàng thành công!",
        order: {
          _id: order._id,
          id: order.DonHangId,
          employeeId: order.NhanVienId,
          sender: order.NguoiGui,
          receiver: order.NguoiNhan,
          phone: order.SDT,
          pickupAddress: order.DiaChiLayHang,
          deliveryAddress: order.DiaChiGiaoHang,
          fee: order.CuocPhi,
          status: order.TrangThai,
          createdAt: order.CreatedAt,
          updatedAt: order.UpdatedAt,
          note: order.GhiChu,
        },
      });
    } catch (err) {
      console.error("Lỗi lấy thông tin đơn hàng:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },
};
