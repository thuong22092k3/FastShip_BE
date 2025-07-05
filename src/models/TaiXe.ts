import { Schema, model } from "mongoose";
import { IUser } from "../interfaces/User";

const TaiXeSchema = new Schema<IUser>({
  TaiXeID: { type: String, required: true, unique: true },
  UserName: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  HoTen: { type: String, required: true },
  Email: { type: String, required: true },
  HieuSuat: { type: Number, required: true },
  CongViec: { type: Number, required: true },
  role: { type: String, default: "TaiXe" },
  DiaDiemId: { type: String, required: true },
});

const TaiXeModel = model<IUser>("TaiXe", TaiXeSchema);
export default TaiXeModel;
