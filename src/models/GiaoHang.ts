import { Schema, model } from "mongoose";
import { IGiaoHang } from "../interfaces/GiaoHang";

const GiaoHangSchema = new Schema<IGiaoHang>({
  GiaoHangId: {
    type: "String",
    required: true,
  },
  DonHangId: {
    type: "String",
    required: true,
  },
  TaiXeID: {
    type: "String",
    required: true,
  },
  PhuongTienId: {
    type: "String",
    required: true,
  },
  PhuongThuc: {
    type: "String",
    required: true,
  },
  TrangThai: {
    type: "String",
    required: true,
  },
  BangChung: {
    type: "String",
    required: true,
  },
});

const GiaoHangModel = model<IGiaoHang>("GiaoHang", GiaoHangSchema);
export default GiaoHangModel;
