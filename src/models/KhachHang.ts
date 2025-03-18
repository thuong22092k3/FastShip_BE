import { Schema, model } from "mongoose";
import { IUser } from "../interfaces/User";

const KhachHangSchema = new Schema<IUser>({
  KhachHangID: { type: String, required: true, unique: true },
  UserName: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  HoTen: { type: String, required: true },
  SDT: { type: String, required: true },
  role: { type: String, default: "KhachHang" },
});

const KhachHangModel = model<IUser>("KhachHang", KhachHangSchema);
export default KhachHangModel;
