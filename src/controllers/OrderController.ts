import { Request, Response } from "express";
import { default as DonHang, default as DonHangModel } from "../models/DonHang";
const calculateShippingFee = (
  packageInfo: any,
  additionalServices: string[]
) => {
  const { length, width, height, weight } = packageInfo;
  const volume = (length * width * height) / 5000;
  const baseFee = Math.max(volume, weight) * 10000;

  let serviceFee = 0;
  if (additionalServices.includes("insurance")) {
    serviceFee += 5000;
  }
  if (additionalServices.includes("codCheck")) {
    serviceFee += 3000;
  }

  return baseFee + serviceFee;
};
export const orderController = {
  createOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        NhanVienID,
        NguoiGui,
        NguoiNhan,
        SDT,
        DiaChiLayHang,
        DiaChiGiaoHang,
        CuocPhi,
        TrangThai,
        GhiChu,
        deliveryMethod,
        payer,
        additionalServices,
        packageInfo,
        packageType,
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
      // const CuocPhi = calculateShippingFee(
      //   packageInfo,
      //   additionalServices || []
      // );
      const newOrder = new DonHang({
        DonHangId: `DH_${Date.now()}`,
        NhanVienID,
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
        deliveryMethod,
        payer,
        additionalServices,
        packageInfo,
        packageType: packageType || "parcel",
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
      const { TrangThai, currentStatus } = req.body;

      const validTransitions: Record<string, string[]> = {
        "Chờ xác nhận": ["Đang giao", "Hủy"],
        "Đang giao": ["Đã giao"],
      };

      if (
        validTransitions[currentStatus] &&
        !validTransitions[currentStatus].includes(TrangThai)
      ) {
        res.status(400).json({
          message: `Không thể chuyển từ ${currentStatus} sang ${TrangThai}`,
        });
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const role = req.query.role as string;
      const id = req.query.id as string;

      if (!role || !id) {
        res.status(401).json({ message: "Thiếu thông tin người dùng" });
        return;
      }

      const skip = (page - 1) * limit;

      let query = {};
      if (role === "NhanVien") {
        query = { NhanVienID: id };
      } else if (role === "TaiXe") {
        query = { TaiXeID: id };
      }

      const [orders, total] = await Promise.all([
        DonHangModel.find(query).skip(skip).limit(limit),
        DonHangModel.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        data: orders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
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
          DonHangId: order.DonHangId,
          NhanVienID: order.NhanVienID,
          NguoiGui: order.NguoiGui,
          NguoiNhan: order.NguoiNhan,
          SDT: order.SDT,
          DiaChiLayHang: order.DiaChiLayHang,
          DiaChiGiaoHang: order.DiaChiGiaoHang,
          CuocPhi: order.CuocPhi,
          TrangThai: order.TrangThai,
          CreatedAt: order.CreatedAt,
          UpdatedAt: order.UpdatedAt,
          GhiChu: order.GhiChu,
        },
      });
    } catch (err) {
      console.error("Lỗi lấy thông tin đơn hàng:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },

  searchOrders: async (req: Request, res: Response) => {
    const { keyword } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!keyword) {
      res.status(400).json({
        success: false,
        message: "Vui lòng nhập từ khóa tìm kiếm",
      });
      return;
    }

    //   searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    //   "i"
    // );
    const normalizeVietnamese = (str: string) => {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
    };

    const charMap: Record<string, string> = {
      a: "aàáảãạăằắẳẵặâầấẩẫậ",
      d: "dđ",
      e: "eèéẻẽẹêềếểễệ",
      i: "iìíỉĩị",
      o: "oòóỏõọôồốổỗộơờớởỡợ",
      u: "uùúủũụưừứửữự",
      y: "yỳýỷỹỵ",
    };

    const toRegexChar = (char: string) => {
      const group = Object.entries(charMap).find(([base, chars]) =>
        chars.includes(char)
      );
      return group ? `[${group[1]}]` : char;
    };
    const searchTerm = normalizeVietnamese(keyword.toString().trim());

    const regexPattern = searchTerm
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split("")
      .map(toRegexChar)
      .join("");

    const regex = new RegExp(regexPattern, "i");

    const [orders, total] = await Promise.all([
      DonHangModel.find({
        $or: [
          { NguoiGui: { $regex: regex } },
          { DonHangId: { $regex: regex } },
          { NguoiGui: { $regex: regex } },
          { NguoiNhan: { $regex: regex } },
          { SDT: { $regex: regex } },
          { DiaChiLayHang: { $regex: regex } },
          { DiaChiGiaoHang: { $regex: regex } },
        ],
      })
        .skip(skip)
        .limit(limit),
      DonHangModel.countDocuments({
        $or: [
          { NguoiGui: { $regex: regex } },
          { DonHangId: { $regex: regex } },
          { NguoiGui: { $regex: regex } },
          { NguoiNhan: { $regex: regex } },
          { SDT: { $regex: regex } },
          { DiaChiLayHang: { $regex: regex } },
          { DiaChiGiaoHang: { $regex: regex } },
        ],
      }),
    ]);
    if (orders.length === 0) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng phù hợp",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  },
  assignDriver: async (req: Request, res: Response): Promise<void> => {
    try {
      const { donHangId, TaiXeID } = req.body;

      if (!donHangId || !TaiXeID) {
        res
          .status(400)
          .json({ message: "Vui lòng cung cấp DonHangId và TaiXeID!" });
        return;
      }

      const order = await DonHangModel.findOne({ DonHangId: donHangId });

      if (!order) {
        res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
        return;
      }

      order.TaiXeID = TaiXeID;
      order.UpdatedAt = new Date().toISOString();
      await order.save();

      res.status(200).json({
        message: "Giao đơn hàng cho tài xế thành công!",
        order,
      });
    } catch (err) {
      console.error("Lỗi giao đơn hàng:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },
  getOrderStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const role = req.query.role as string;
      const id = req.query.id as string;

      if (!role || !id) {
        res.status(401).json({ message: "Thiếu thông tin người dùng" });
        return;
      }

      let query = {};
      if (role === "NhanVien") {
        query = { NhanVienID: id };
      } else if (role === "TaiXe") {
        query = { TaiXeID: id };
      }

      const [total, active, completed] = await Promise.all([
        DonHangModel.countDocuments(query),
        DonHangModel.countDocuments({
          ...query,
          TrangThai: { $ne: "Đã giao" },
        }),
        DonHangModel.countDocuments({ ...query, TrangThai: "Đã giao" }),
      ]);

      res.status(200).json({
        success: true,
        stats: {
          total,
          active,
          completed,
        },
      });
    } catch (err) {
      console.error("Lỗi lấy thống kê đơn hàng:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },
};
