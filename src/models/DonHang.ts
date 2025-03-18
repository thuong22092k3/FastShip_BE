import { Schema, model } from "mongoose";
import { IDonHang } from "../interfaces/DonHang";

const DonHangSchema = new Schema<IDonHang>({
  DonHangId: {
    type: "String",
    required: true,
  },
  NhanVienId: {
    type: "String",
    required: true,
  },
  NguoiGui: {
    type: "String",
    required: true,
  },
  NguoiNhan: {
    type: "String",
    required: true,
  },
  SDT: {
    type: "String",
    required: true,
  },
  DiaChiLayHang: {
    type: "String",
    required: true,
  },
  DiaChiGiaoHang: {
    type: "String",
    required: true,
  },
  CuocPhi: {
    type: "Number",
    required: true,
  },
  TrangThai: {
    type: "String",
    required: true,
  },
  CreatedAt: {
    type: "String",
    required: true,
  },
  UpdateAt: {
    type: "String",
    required: true,
  },
  GhiChu: {
    type: "String",
    required: true,
  },
});

const DonHangModel = model<IDonHang>("DonHang", DonHangSchema);
export default DonHangModel;
