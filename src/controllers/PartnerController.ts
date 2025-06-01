import { Response, Request } from "express";
import { IDoiTac } from "../interfaces/DoiTac";
import DoiTac from "../models/DoiTac";
import DoiTacModel from "../models/DoiTac";

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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      // const doitacs = await DoiTac.find();
      const [doitacs, total] = await Promise.all([
        DoiTac.find().skip(skip).limit(limit),
        DoiTac.countDocuments(),
      ]);
      // res.status(200).json({ message: "Danh sách đối tác:", data: doitacs });
      res.status(200).json({
        message: "Danh sách đối tác:",
        data: doitacs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.error("Lỗi lấy danh sách đối tác:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },
  searchPartners: async (req: Request, res: Response) => {
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

    // const partners = await DoiTacModel.find({
    //   $or: [
    //     { TenDoiTac: { $regex: regex } },
    //     { DoiTacId: { $regex: regex } },
    //     { SDT: { $regex: regex } },
    //     { NguoiLienLac: { $regex: regex } },
    //     { DiaChi: { $regex: regex } },
    //   ],
    // });
    const [partners, total] = await Promise.all([
      DoiTacModel.find({
        $or: [
          { TenDoiTac: { $regex: regex } },
          { DoiTacId: { $regex: regex } },
          { SDT: { $regex: regex } },
          { NguoiLienLac: { $regex: regex } },
          { DiaChi: { $regex: regex } },
        ],
      })
        .skip(skip)
        .limit(limit),
      DoiTacModel.countDocuments({
        $or: [
          { TenDoiTac: { $regex: regex } },
          { DoiTacId: { $regex: regex } },
          { SDT: { $regex: regex } },
          { NguoiLienLac: { $regex: regex } },
          { DiaChi: { $regex: regex } },
        ],
      }),
    ]);

    if (partners.length === 0) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy đối tác phù hợp",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: partners,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  },
};
