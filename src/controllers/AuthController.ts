import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Admin from "../models/Admin";
import KhachHang from "../models/KhachHang";
import NhanVien from "../models/NhanVien";
import TaiXe from "../models/TaiXe";
import { IUser } from "../interfaces/User";

export const authController = {
  // Đăng nhập
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

  // Tạo tài khoản
  // createUser: async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const {
  //       role,
  //       UserName,
  //       Password,
  //       HoTen,
  //       Email,
  //       SDT,
  //       HieuSuat,
  //       CongViec,
  //     } = req.body;

  //     if (!UserName || !Password || !HoTen) {
  //       res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
  //       return;
  //     }

  //     const existingUser =
  //       (await Admin.findOne({ UserName }).exec()) ||
  //       (await KhachHang.findOne({ UserName }).exec()) ||
  //       (await NhanVien.findOne({ UserName }).exec()) ||
  //       (await TaiXe.findOne({ UserName }).exec());

  //     if (existingUser) {
  //       res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });
  //       return;
  //     }

  //     const salt = await bcrypt.genSalt(10);
  //     const hashedPassword = await bcrypt.hash(Password, salt);

  //     let newUser;
  //     switch (role) {
  //       case "Admin":
  //         newUser = new Admin({
  //           AdminID: `AD_${Date.now()}`,
  //           UserName,
  //           Password: hashedPassword,
  //           HoTen,
  //           Email,
  //           role,
  //         });
  //         break;
  //       case "KhachHang":
  //         newUser = new KhachHang({
  //           KhachHangID: `KH_${Date.now()}`,
  //           UserName,
  //           Password: hashedPassword,
  //           HoTen,
  //           SDT,
  //           role,
  //         });
  //         break;
  //       case "NhanVien":
  //         newUser = new NhanVien({
  //           NhanVienID: `NV_${Date.now()}`,
  //           UserName,
  //           Password: hashedPassword,
  //           HoTen,
  //           Email,
  //           HieuSuat,
  //           role,
  //         });
  //         break;
  //       case "TaiXe":
  //         newUser = new TaiXe({
  //           TaiXeID: `TX_${Date.now()}`,
  //           UserName,
  //           Password: hashedPassword,
  //           HoTen,
  //           Email,
  //           HieuSuat,
  //           CongViec,
  //           role,
  //         });
  //         break;
  //       default:
  //         res.status(400).json({ message: "Loại người dùng không hợp lệ!" });
  //         return;
  //     }

  //     await newUser.save();
  //     res
  //       .status(200)
  //       .json({ message: "Tạo tài khoản thành công!", user: newUser });
  //   } catch (err) {
  //     console.error("Lỗi tạo tài khoản:", err);
  //     res.status(500).json({ message: "Lỗi hệ thống!" });
  //   }
  // },
  createUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        role,
        UserName,
        Password,
        HoTen,
        Email,
        SDT,
        HieuSuat,
        CongViec,
      } = req.body;

      // Validate required fields
      if (!UserName || !Password || !HoTen) {
        res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
        return;
      }

      // Validate password length
      if (Password.length < 8) {
        res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự" });
        return;
      }

      // Validate email format if provided
      if (Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) {
        res.status(400).json({ message: "Email không hợp lệ" });
        return;
      }

      // Check for existing user
      const existingUser =
        (await Admin.findOne({ UserName }).exec()) ||
        (await KhachHang.findOne({ UserName }).exec()) ||
        (await NhanVien.findOne({ UserName }).exec()) ||
        (await TaiXe.findOne({ UserName }).exec());

      if (existingUser) {
        res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });
        return;
      }

      // Validate efficiency range
      if (HieuSuat && (HieuSuat < 0 || HieuSuat > 100)) {
        res.status(400).json({ message: "Hiệu suất phải từ 0 đến 100" });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Password, salt);

      let newUser;
      switch (role) {
        case "Admin":
          newUser = new Admin({
            AdminID: `AD_${Date.now()}`,
            UserName,
            Password: hashedPassword,
            HoTen,
            Email,
            role,
          });
          break;
        case "KhachHang":
          newUser = new KhachHang({
            KhachHangID: `KH_${Date.now()}`,
            UserName,
            Password: hashedPassword,
            HoTen,
            SDT,
            role,
          });
          break;
        case "NhanVien":
          newUser = new NhanVien({
            NhanVienID: `NV_${Date.now()}`,
            UserName,
            Password: hashedPassword,
            HoTen,
            Email,
            HieuSuat,
            role,
          });
          break;
        case "TaiXe":
          newUser = new TaiXe({
            TaiXeID: `TX_${Date.now()}`,
            UserName,
            Password: hashedPassword,
            HoTen,
            Email,
            HieuSuat,
            CongViec,
            role,
          });
          break;
        default:
          res.status(400).json({ message: "Loại người dùng không hợp lệ!" });
          return;
      }

      await newUser.save();
      res
        .status(200)
        .json({ message: "Tạo tài khoản thành công!", user: newUser });
    } catch (err) {
      console.error("Lỗi tạo tài khoản:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },
  // Cập nhật tài khoản
  updateUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { UserName, Password, HoTen, Email, SDT, HieuSuat, CongViec } =
        req.body;

      if (!UserName) {
        res.status(400).json({ message: "Vui lòng cung cấp tên đăng nhập!" });
        return;
      }

      const userTypes = [
        { model: Admin, role: "Admin" },
        { model: KhachHang, role: "KhachHang" },
        { model: NhanVien, role: "NhanVien" },
        { model: TaiXe, role: "TaiXe" },
      ];

      let updatedUser = null;
      for (const userType of userTypes) {
        const foundUser = await userType.model.findOne({ UserName }).exec();
        if (foundUser) {
          let updateData: Partial<IUser> = {
            HoTen,
            Email,
            SDT,
            HieuSuat,
            CongViec,
          };

          if (Password) {
            const salt = await bcrypt.genSalt(10);
            updateData.Password = await bcrypt.hash(Password, salt);
          }

          updatedUser = await userType.model
            .findOneAndUpdate({ UserName }, { $set: updateData }, { new: true })
            .exec();
          break;
        }
      }

      if (!updatedUser) {
        res
          .status(404)
          .json({ message: "Không tìm thấy tài khoản để cập nhật!" });
        return;
      }

      res
        .status(200)
        .json({ message: "Cập nhật tài khoản thành công!", user: updatedUser });
    } catch (err) {
      console.error("Lỗi cập nhật tài khoản:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },

  getUserDetail: async (req: Request, res: Response): Promise<void> => {
    try {
      const { UserName } = req.params;

      const userTypes = [
        { model: Admin, role: "Admin" },
        { model: KhachHang, role: "KhachHang" },
        { model: NhanVien, role: "NhanVien" },
        { model: TaiXe, role: "TaiXe" },
      ];

      for (const userType of userTypes) {
        const user = await userType.model.findOne({ UserName }).exec();
        if (user) {
          res.status(200).json({
            user: {
              ...user.toObject(),
              role: userType.role,
            },
          });
          return;
        }
      }

      res.status(404).json({ message: "Không tìm thấy người dùng!" });
    } catch (err) {
      console.error("Lỗi lấy chi tiết người dùng:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },

  getAllUsers: async (req: Request, res: Response): Promise<void> => {
    try {
      const { role } = req.query;

      let users = [];
      switch (role) {
        case "Admin":
          users = await Admin.find().exec();
          break;
        case "KhachHang":
          users = await KhachHang.find().exec();
          break;
        case "NhanVien":
          users = await NhanVien.find().exec();
          break;
        case "TaiXe":
          users = await TaiXe.find().exec();
          break;
        default:
          res.status(400).json({ message: "Role không hợp lệ!" });
          return;
      }

      const usersWithRole = users.map((user) => ({
        ...user.toObject(),
        role,
      }));

      res.status(200).json({ users: usersWithRole });
    } catch (err) {
      console.error("Lỗi getAllUsers:", err);
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },

  //Delete user
  deleteUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { UserName } = req.query;

      if (!UserName) {
        res.status(400).json({ message: "Vui lòng cung cấp tên đăng nhập!" });
        return;
      }

      const userTypes = [
        { model: Admin, role: "Admin" },
        { model: KhachHang, role: "KhachHang" },
        { model: NhanVien, role: "NhanVien" },
        { model: TaiXe, role: "TaiXe" },
      ];

      let deleted = false;
      for (const userType of userTypes) {
        const result = await userType.model
          .findOneAndDelete({ UserName })
          .exec();
        if (result) {
          deleted = true;
          break;
        }
      }

      if (!deleted) {
        res.status(404).json({ message: "Không tìm thấy tài khoản để xóa!" });
        return;
      }

      res.status(200).json({ message: "Xóa tài khoản thành công!" });
    } catch (err) {
      console.error("Lỗi xóa tài khoản:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  },
};
