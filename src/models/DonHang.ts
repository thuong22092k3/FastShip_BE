import { Schema, model } from "mongoose";
import { IDonHang } from "../interfaces/DonHang";

const DonHangSchema = new Schema<IDonHang>({
  DonHangId: {
    type: "String",
    required: false,
  },
  NhanVienID: {
    type: "String",
    required: false,
  },
  NguoiGui: {
    type: "String",
    required: false,
  },
  NguoiNhan: {
    type: "String",
    required: false,
  },
  SDT: {
    type: "String",
    required: false,
  },
  DiaChiLayHang: {
    type: "String",
    required: false,
  },
  DiaChiGiaoHang: {
    type: "String",
    required: false,
  },
  CuocPhi: {
    type: "Number",
    required: false,
  },
  TrangThai: {
    type: "String",
    required: false,
  },
  CreatedAt: {
    type: "String",
    required: false,
  },
  UpdatedAt: {
    type: "String",
    required: false,
  },
  GhiChu: {
    type: "String",
    required: false,
  },

  deliveryMethod: { type: "String", required: false },
  payer: {
    type: String,
    enum: ["sender", "receiver"],
    default: "sender",
  },
  additionalServices: [
    {
      type: String,
      enum: ["viewBeforePay", "codCheck", "insurance"],
    },
  ],
  packageInfo: {
    length: { type: "Number", required: false },
    width: { type: "Number", required: false },
    height: { type: "Number", required: false },
    weight: { type: "Number", required: false },
  },
  packageType: {
    type: String,
    enum: ["document", "parcel", "heavy_parcel", "fragile"],
    required: false,
    default: "parcel",
  },
  TaiXeID: {
    type: "String",
    required: false,
  },
});

const DonHangModel = model<IDonHang>("DonHang", DonHangSchema);
export default DonHangModel;
