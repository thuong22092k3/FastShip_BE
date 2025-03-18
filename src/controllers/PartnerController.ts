import { Response, Request } from "express";
import { IDoiTac } from "../interfaces/DoiTac";
import DoiTac from "../models/DoiTac";

export const partnerController = {
  createPartner: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        DoiTacId,
        TenDoiTac,
        KieuDoiTac,
        NguoiLienLac,
        SDT,
        Email,
        DiaChi,
        SoGiayPhep,
        SucChua,
        KhuVucHoatDong,
      } = req.body;

      if (
        !TenDoiTac ||
        !KieuDoiTac ||
        !NguoiLienLac ||
        !SDT ||
        !Email ||
        !DiaChi ||
        !SoGiayPhep ||
        !SucChua
      ) {
        res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
        return;
      }

      const existPartner = await DoiTac.findOne({ TenDoiTac }).exec();
      if (existPartner) {
        res.status(400).json({ message: "Đối tác đã tồn tại!" });
      }

      let newPartner;
      newPartner = new DoiTac({
        DoiTacId: `DT_${Date.now()}`,
        TenDoiTac,
        KieuDoiTac,
        NguoiLienLac,
        SDT,
        Email,
        DiaChi,
        SoGiayPhep,
        SucChua,
        KhuVucHoatDong,
      });
      await newPartner.save();
      res
        .status(200)
        .json({ message: "Tạo đối tượng thành công!", partner: newPartner });
    } catch (err) {
      console.error("Lỗi thêm đối tác: ", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },

  updatePartner: async (req: Request, res: Response): Promise<void> => {
    try {
      const { DoiTacId, ...body } = req.body;

      const updatePartner = await DoiTac.findOneAndUpdate(
        { DoiTacId },
        { ...body },
        { new: true }
      );

      if (!updatePartner) {
        res.status(404).json({ message: "Không tìm thấy đối tác" });
        return;
      }

      res.status(200).json({
        message: "Cập nhật đối tác thành công!",
        partner: updatePartner,
      });
      console.log("Cập nhật thành công!");
      console.log("Partner:", updatePartner);
    } catch (err) {
      console.error("LỖI CẬP NHẬT ĐỐI TÁC:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },

  deletePartner: async (req: Request, res: Response): Promise<void> => {
    try {
      const { DoiTacId } = req.query;
      if (!DoiTacId || typeof DoiTacId !== "string") {
        res.status(400).json({ message: "Lỗi xóa đối tác: Thiếu ID hợp lệ!" });
        return;
      }

      const deleteDoiTac = await DoiTac.deleteOne({ DoiTacId });

      if (deleteDoiTac.deletedCount === 0) {
        res.status(404).json({
          message: "Lỗi xóa đối tác: Không tìm thấy đối tác!",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Xóa đối tác thành công!",
        deletedCount: deleteDoiTac.deletedCount,
      });
    } catch (err) {
      console.error("LỖI XÓA ĐỐI TÁC:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },

  getAllPartner: async (req: Request, res: Response): Promise<void> => {
    try {
      const doitacs = await DoiTac.find();
      res.status(200).json({ message: "Danh sách đối tác:", data: doitacs });
    } catch (err) {
      console.error("Lỗi lấy danh sách đối tác:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },
};
