import { Request, Response } from "express";
import { IPhuongTien } from "../interfaces/PhuongTien";
import PhuongTien from "../models/PhuongTien";
import BaoDuong from "../models/BaoDuong";

export const vehicleController = {
  //Thêm phương tiện
  createVehicle: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        PhuongTienId,
        HangXe,
        TaiXeId,
        BienSo,
        LoaiXe,
        SucChua,
        TrangThai,
        BaoDuong,
      } = req.body;

      if (
        !PhuongTienId ||
        !HangXe ||
        !TaiXeId ||
        !BienSo ||
        !LoaiXe ||
        !SucChua ||
        !TrangThai ||
        !BaoDuong
      ) {
        res
          .status(400)
          .json({ message: "Vui lòng nhập đầy đủ thông tin phương tiện!" });
        return;
      }

      const existingVehicle = await PhuongTien.findOne({ BienSo }).exec();
      if (existingVehicle) {
        res
          .status(409)
          .json({ message: "Phương tiện với biển số này đã tồn tại!" });
        return;
      }

      const newVehicle = new PhuongTien({
        PhuongTienId: `PT_${Date.now()}`,
        HangXe,
        TaiXeId,
        BienSo,
        LoaiXe,
        SucChua,
        TrangThai,
        BaoDuong,
      });

      await newVehicle.save();

      res
        .status(201)
        .json({ message: "Thêm phương tiện thành công!", vehicle: newVehicle });
    } catch (err) {
      console.error("Lỗi thêm phương tiện:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },
  //Cập nhật phương tiện
  updateVehicle: async (req: Request, res: Response): Promise<void> => {
    try {
      const { PhuongTienId, ...body } = req.body;

      const updateVehicle = await PhuongTien.findOneAndUpdate(
        { PhuongTienId },
        { ...body },
        { new: true }
      );

      if (!updateVehicle) {
        res.status(404).json({ message: "Không tìm thấy phương tiện!" });
        return;
      }

      res.status(200).json({
        message: "Cập nhật phương tiện thành công!",
        vehicle: updateVehicle,
      });
      console.log("Cập nhật thành công!");
      console.log("Vehicle:", updateVehicle);
    } catch (err) {
      console.error("LỖI CẬP NHẬT PHƯƠNG TIỆN:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },

  //Xóa phương tiện
  deleteVehicle: async (req: Request, res: Response): Promise<void> => {
    try {
      const { PhuongTienId } = req.query;

      if (!PhuongTienId || typeof PhuongTienId !== "string") {
        res
          .status(400)
          .json({ message: "Lỗi xóa phương tiện: Thiếu ID hợp lệ!" });
        return;
      }

      const deleteVehicle = await PhuongTien.deleteOne({ PhuongTienId });

      if (deleteVehicle.deletedCount === 0) {
        res.status(404).json({
          message: "Lỗi xóa phương tiện: Không tìm thấy phương tiện!",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Xóa phương tiện thành công!",
        deletedCount: deleteVehicle.deletedCount,
      });
    } catch (err) {
      console.error("Lỗi xóa phương tiện:", err);
      res.status(500).json({ message: "Lỗi xóa phương tiện: Lỗi hệ thống!" });
    }
  },
  //Lấy danh sách phương tiện
  getAllVehicle: async (req: Request, res: Response): Promise<void> => {
    try {
      const vehicles = await PhuongTien.find();
      res
        .status(200)
        .json({ message: "Danh sách phương tiện", data: vehicles });
    } catch (err) {
      console.error("Lỗi lấy danh sách phương tiện:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },

  //Tạo phiếu bảo dưỡng
  createBaoDuong: async (req: Request, res: Response): Promise<void> => {
    try {
      const { BaoDuongId, PhuongTienId, Ngay, TrangThai, ChiPhi } = req.body;

      if (
        !BaoDuongId ||
        !PhuongTienId ||
        !Ngay ||
        !TrangThai ||
        ChiPhi === undefined
      ) {
        res.status(400).json({ message: "Thiếu thông tin phiếu bảo dưỡng!" });
        return;
      }

      const vehicleExists = await PhuongTien.findOne({ PhuongTienId });
      if (!vehicleExists) {
        res.status(404).json({ message: "Không tìm thấy phương tiện!" });
        return;
      }

      const newBaoDuong = new BaoDuong({
        BaoDuongId: `BD_${Date.now()}`,
        PhuongTienId,
        Ngay,
        TrangThai,
        ChiPhi,
      });
      await newBaoDuong.save();

      res.status(201).json({
        message: "Tạo phiếu bảo dưỡng thành công!",
        data: newBaoDuong,
      });
    } catch (err) {
      console.error("Lỗi tạo phiếu bảo dưỡng:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },

  // Cập nhật phiếu bảo dưỡng
  updateBaoDuong: async (req: Request, res: Response): Promise<void> => {
    try {
      const { BaoDuongId, ...body } = req.body;

      const updatedBaoDuong = await BaoDuong.findOneAndUpdate(
        { BaoDuongId },
        body,
        { new: true }
      );

      if (!updatedBaoDuong) {
        res.status(404).json({ message: "Không tìm thấy phiếu bảo dưỡng!" });
        return;
      }

      res.status(200).json({
        message: "Cập nhật phiếu bảo dưỡng thành công!",
        data: updatedBaoDuong,
      });
    } catch (err) {
      console.error("Lỗi cập nhật phiếu bảo dưỡng:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },

  // Lấy danh sách phiếu bảo dưỡng
  getAllBaoDuong: async (req: Request, res: Response): Promise<void> => {
    try {
      const baoDuongList = await BaoDuong.find();
      res
        .status(200)
        .json({ message: "Danh sách phiếu bảo dưỡng", data: baoDuongList });
    } catch (err) {
      console.error("Lỗi lấy danh sách phiếu bảo dưỡng:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },

  // Xóa phiếu bảo dưỡng
  deleteBaoDuong: async (req: Request, res: Response): Promise<void> => {
    try {
      const { BaoDuongId } = req.query;

      if (!BaoDuongId || typeof BaoDuongId !== "string") {
        res.status(400).json({ message: "Thiếu mã phiếu bảo dưỡng!" });
        return;
      }

      const deleteResult = await BaoDuong.deleteOne({ BaoDuongId });

      if (deleteResult.deletedCount === 0) {
        res.status(404).json({ message: "Không tìm thấy phiếu bảo dưỡng!" });
        return;
      }

      res.status(200).json({ message: "Xóa phiếu bảo dưỡng thành công!" });
    } catch (err) {
      console.error("Lỗi xóa phiếu bảo dưỡng:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },
};
