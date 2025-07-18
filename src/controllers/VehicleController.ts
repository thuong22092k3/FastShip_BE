import { Request, Response } from "express";
import {
  default as BaoDuong,
  default as BaoDuongModel,
} from "../models/BaoDuong";
import {
  default as PhuongTien,
  default as PhuongTienModel,
} from "../models/PhuongTien";

export const vehicleController = {
  //Thêm phương tiện
  createVehicle: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        PhuongTienId,
        HangXe,
        TaiXeID,
        BienSo,
        LoaiXe,
        SucChua,
        TrangThai,
        BaoDuong,
        DiaDiemId,
      } = req.body;

      if (
        !PhuongTienId ||
        !HangXe ||
        !TaiXeID ||
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
        TaiXeID,
        BienSo,
        LoaiXe,
        SucChua,
        TrangThai,
        BaoDuong,
        DiaDiemId,
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
  getAllVehicle: async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const [vehicles, total] = await Promise.all([
        PhuongTienModel.find().skip(skip).limit(limit),
        PhuongTienModel.countDocuments(),
      ]);
      // const vehicles = await PhuongTien.find();
      res.status(200).json({
        message: "Danh sách phương tiện",
        data: vehicles,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.error("Lỗi lấy danh sách phương tiện:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },

  searchVehicles: async (req: Request, res: Response) => {
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

    const searchTerm = keyword.toString();
    const regex = new RegExp(
      searchTerm.replace(/[-_.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    const [vehicles, total] = await Promise.all([
      PhuongTienModel.find({
        $or: [
          { HangXe: { $regex: regex } },
          { PhuongTienId: { $regex: regex } },
          { BienSo: { $regex: regex } },
          { LoaiXe: { $regex: regex } },
        ],
      })
        .skip(skip)
        .limit(limit),
      PhuongTienModel.countDocuments({
        $or: [
          { HangXe: { $regex: regex } },
          { PhuongTienId: { $regex: regex } },
          { BienSo: { $regex: regex } },
          { LoaiXe: { $regex: regex } },
        ],
      }),
    ]);
    if (vehicles.length === 0) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy phương tiện phù hợp",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: vehicles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  },

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

  getAllBaoDuong: async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      // const baoDuongList = await BaoDuong.find();
      const [mantainces, total] = await Promise.all([
        BaoDuongModel.find().skip(skip).limit(limit),
        BaoDuongModel.countDocuments(),
      ]);
      res.status(200).json({
        message: "Danh sách phiếu bảo dưỡng",
        data: mantainces,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.error("Lỗi lấy danh sách phiếu bảo dưỡng:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },

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

  searchMantainces: async (req: Request, res: Response) => {
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

    // const searchTerm = keyword.toString();
    // const regex = new RegExp(
    //   searchTerm.replace(/[-_.*+?^${}()|[\]\\]/g, "\\$&"),
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
    const [mantainces, total] = await Promise.all([
      BaoDuongModel.find({
        $or: [
          { Ngay: { $regex: regex } },
          { BaoDuongId: { $regex: regex } },
          { TrangThai: { $regex: regex } },
          // { ChiPhi: { $regex: regex } },
        ],
      })
        .skip(skip)
        .limit(limit),
      BaoDuongModel.countDocuments({
        $or: [
          { Ngay: { $regex: regex } },
          { BaoDuongId: { $regex: regex } },
          { TrangThai: { $regex: regex } },
          // { ChiPhi: { $regex: regex } },
        ],
      }),
    ]);
    if (mantainces.length === 0) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy bảo dưỡng phù hợp",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: mantainces,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  },
};
