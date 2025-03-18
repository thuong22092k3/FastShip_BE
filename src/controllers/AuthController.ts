import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Admin from "../models/Admin";
import KhachHang from "../models/KhachHang";
import NhanVien from "../models/NhanVien";
import TaiXe from "../models/TaiXe";
import { IUser } from "../interfaces/User";

export const authController = {
  loginUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { UserName, Password } = req.body;

      if (!UserName || !Password) {
        res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
        return;
      }

      const userTypes = [
        { model: Admin, role: "Admin" },
        { model: KhachHang, role: "KhachHang" },
        { model: NhanVien, role: "NhanVien" },
        { model: TaiXe, role: "TaiXe" },
      ];

      let user: IUser | null = null;
      let userRole = "";

      for (const userType of userTypes) {
        const foundUser = await userType.model.findOne({ UserName }).exec();
        if (foundUser) {
          user = foundUser as IUser;
          userRole = userType.role;
          break;
        }
      }

      if (!user) {
        res
          .status(404)
          .json({ message: "Tên đăng nhập bị sai hoặc không tồn tại!" });
        return;
      }

      const validPassword =
        (await bcrypt.compare(Password, user.Password)) ||
        Password === user.Password;
      if (!validPassword) {
        res.status(401).json({ message: "Sai mật khẩu" });
        return;
      }

      res.status(200).json({
        message: "Đăng nhập thành công",
        user: {
          id: user._id,
          UserName: user.UserName,
          HoTen: user.HoTen,
          role: userRole,
        },
      });
    } catch (err) {
      console.error("ERROR GET USER:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },
};
