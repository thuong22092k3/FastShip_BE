import { Schema, model } from "mongoose";
import { IDoiTac } from "../interfaces/DoiTac";

const DoiTacSchema = new Schema<IDoiTac>({
  DoiTacId: {
    type: "String",
    required: true,
  },
  TenDoiTac: {
    type: "String",
    required: true,
  },
  KieuDoiTac: {
    type: "String",
    required: true,
  },
  NguoiLienLac: {
    type: "String",
    required: true,
  },
  SDT: {
    type: "String",
    required: true,
  },
  Email: {
    type: "String",
    required: true,
  },
  DiaChi: {
    type: "String",
    required: true,
  },
  SoGiayPhep: {
    type: "String",
    required: true,
  },
  SucChua: {
    type: "Number",
    required: true,
  },
  KhuVucHoatDong: {
    type: "String",
    required: true,
  },
});

const DoiTacModel = model<IDoiTac>("DoiTac", DoiTacSchema);
export default DoiTacModel;
