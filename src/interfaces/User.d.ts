import { Document } from "mongoose";

export interface IUser extends Document {
  UserName: string;
  Password: string;
  HoTen: string;
  Email?: string;
  SDT?: string;
  HieuSuat?: number;
  CongViec?: number;
  role: "Admin" | "KhachHang" | "NhanVien" | "TaiXe";
  AdminID?: string;
  KhachHangID?: string;
  NhanVienID?: string;
  TaiXeID?: string;
  DiaDiemId?: string;
}
