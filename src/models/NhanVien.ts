import { Schema, model } from "mongoose";
import { IUser } from "../interfaces/User";

const NhanVienSchema = new Schema<IUser>({
  NhanVienID: { type: String, required: true, unique: true },
  UserName: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  HoTen: { type: String, required: true },
  Email: { type: String, required: true },
  HieuSuat: { type: Number, required: true },
  role: { type: String, default: "NhanVien" },
});

const NhanVienModel = model<IUser>("NhanVien", NhanVienSchema);
export default NhanVienModel;
