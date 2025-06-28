export interface IDonHang {
  DonHangId: string;
  NhanVienID: string;
  NguoiGui: string;
  NguoiNhan: string;
  SDT: string;
  DiaChiLayHang: string;
  DiaChiGiaoHang: string;
  CuocPhi: number;
  TrangThai: string;
  CreatedAt: string;
  UpdatedAt: string;
  GhiChu: string;

  deliveryMethod?: string;
  payer?: string;
  additionalServices?: string[];
  packageInfo?: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  packageType?: "document" | "parcel" | "heavy_parcel" | "fragile";
  TaiXeID?: string;
}
