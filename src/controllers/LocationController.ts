import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import DiaDiemModel from "../models/DiaDiem";
import { IDiaDiem } from "../interfaces/DiaDiem";

export const locationController = {
  createLocation: asyncHandler(async (req: Request, res: Response) => {
    const { DiaDiemId, name, latitude, longitude } = req.body;

    const existingLocation = await DiaDiemModel.findOne({ DiaDiemId });
    if (existingLocation) {
      res.status(400).json({
        success: false,
        message: "Bưu cục đã tồn tại",
      });
      return;
    }

    const newLocation = new DiaDiemModel({
      DiaDiemId,
      name,
      latitude,
      longitude,
    });

    await newLocation.save();

    res.status(201).json({
      success: true,
      data: newLocation,
      message: "Tạo bưu cục thành công",
    });
  }),

  getAllLocations: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const [locations, total] = await Promise.all([
      DiaDiemModel.find().skip(skip).limit(limit),
      DiaDiemModel.countDocuments(),
    ]);
    // const locations = await DiaDiemModel.find();
    res.status(200).json({
      success: true,
      data: locations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }),

  getLocationById: asyncHandler(async (req: Request, res: Response) => {
    console.log("Đang gọi searchLocations");
    const { id } = req.params;
    const location = await DiaDiemModel.findOne({ DiaDiemId: id });

    if (!location) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy bưu cục có id này ",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: location,
    });
  }),

  updateLocation: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedLocation = await DiaDiemModel.findOneAndUpdate(
      { DiaDiemId: id },
      updateData,
      { new: true }
    );

    if (!updatedLocation) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy bưu cục để cập nhật",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedLocation,
      message: "Cập nhật bưu cục thành công",
    });
  }),

  deleteLocation: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const deletedLocation = await DiaDiemModel.findOneAndDelete({
      DiaDiemId: id,
    });

    if (!deletedLocation) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy bưu cục để xóa",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Xóa bưu cục thành công",
      data: deletedLocation,
    });
  }),

  searchLocations: asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!name) {
      res.status(400).json({
        success: false,
        message: "Vui lòng nhập từ khóa tìm kiếm",
      });
      return;
    }

    // const searchTerm = name.toString();
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
    const searchTerm = normalizeVietnamese(name.toString().trim());

    const regexPattern = searchTerm
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split("")
      .map(toRegexChar)
      .join("");

    const regex = new RegExp(regexPattern, "i");

    // const locations = await DiaDiemModel.find({
    //   $or: [{ name: { $regex: regex } }, { DiaDiemId: { $regex: regex } }],
    // });

    const [locations, total] = await Promise.all([
      DiaDiemModel.find({
        $or: [{ name: { $regex: regex } }, { DiaDiemId: { $regex: regex } }],
      })
        .skip(skip)
        .limit(limit),
      DiaDiemModel.countDocuments({
        $or: [{ name: { $regex: regex } }, { DiaDiemId: { $regex: regex } }],
      }),
    ]);
    if (locations.length === 0) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy bưu cục phù hợp",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: locations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }),
};
