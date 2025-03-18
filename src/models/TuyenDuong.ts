import { Schema, model } from "mongoose";
import { ITuyenDuong } from "../interfaces/TuyenDuong";

const TuyenDuongSchema = new Schema<ITuyenDuong>({
  TuyenDuongId: {
    type: "string",
    required: true,
  },
  KhoangCach: {
    type: "number",
    required: true,
  },
  ThoiGianUocTinh: {
    type: "number",
    required: true,
  },
  TuyenDuongToiUu: {
    type: "string",
    required: true,
  },
});

const TuyenDuongModel = model<ITuyenDuong>("TuyenDuong", TuyenDuongSchema);
export default TuyenDuongModel;
