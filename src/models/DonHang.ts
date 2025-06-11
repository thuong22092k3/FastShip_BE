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
  UpdatedAt: {
    type: "String",
    required: true,
  },
  GhiChu: {
    type: "String",
    required: true,
  },

  deliveryMethod: { type: "String" },
  payer: { type: "String" },
  additionalServices: [{ type: "String" }],
  packageInfo: {
    length: { type: "Number" },
    width: { type: "Number" },
    height: { type: "Number" },
    weight: { type: "Number" },
  },
});

const DonHangModel = model<IDonHang>("DonHang", DonHangSchema);
export default DonHangModel;
