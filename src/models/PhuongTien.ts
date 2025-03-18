import { Schema, model } from "mongoose";
import { IPhuongTien } from "../interfaces/PhuongTien";

const PhuongTienSchema = new Schema<IPhuongTien>({
  PhuongTienId: {
    type: "String",
    required: true,
    unique: true,
  },
  HangXe: {
    type: String,
    required: true,
  },
  TaiXeId: {
    type: "String",
    required: false,
  },
  BienSo: {
    type: "String",
    required: true,
    unique: true,
  },
  LoaiXe: {
    type: "String",
    required: true,
  },
  SucChua: {
    type: "Number",
    required: true,
  },
  TrangThai: {
    type: String,
    required: true,
    enum: ["Hoạt động", "Bảo dưỡng", "Ngừng hoạt động"],
  },
  BaoDuong: {
    type: "String",
    required: true,
  },
});

const PhuongTienModel = model<IPhuongTien>("PhuongTien", PhuongTienSchema);
export default PhuongTienModel;
