import { Schema, model } from "mongoose";
import { IBaoDuong } from "../interfaces/BaoDuong";

const BaoDuongSchema = new Schema<IBaoDuong>({
  BaoDuongId: {
    type: "String",
    required: true,
  },
  PhuongTienId: {
    type: "String",
    required: true,
  },
  Ngay: {
    type: "String",
    required: true,
  },
  TrangThai: {
    type: "String",
    required: true,
  },
  ChiPhi: {
    type: "number",
    required: true,
  },
});

const BaoDuongModel = model<IBaoDuong>("BaoDuong", BaoDuongSchema);
export default BaoDuongModel;
