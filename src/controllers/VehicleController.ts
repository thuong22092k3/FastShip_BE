import { Request, Response } from "express";
import { IPhuongTien } from "../interfaces/PhuongTien";
import PhuongTien from "../models/PhuongTien";

export const vehicleController = {
  addVehicle: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        PhuongTienId,
        // TaiXeId,
        BienSo,
        LoaiXe,
        SucChua,
        TrangThai,
        BaoDuong,
      } = req.body;

      if (
        !PhuongTienId ||
        // !TaiXeId ||
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
        PhuongTienId,
        // TaiXeId,
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

  updateVehicle: async (req: Request, res: Response): Promise<void> => {
    try {
      const { PhuongTienId, ...body } = req.body;

      const updateVehicle = await PhuongTien.findOneAndUpdate(
        { PhuongTienId }, // Tìm bằng PhuongTienId (String)
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
        res
          .status(404)
          .json({
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
};
