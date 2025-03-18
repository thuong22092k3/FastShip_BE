import { Schema, model } from "mongoose";
import { IUser } from "../interfaces/User";

const AdminSchema = new Schema<IUser>({
  AdminID: { type: String, required: true, unique: true },
  UserName: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  HoTen: { type: String, required: true },
  Email: { type: String, required: true },
  role: { type: String, default: "Admin" },
});

const AdminModel = model<IUser>("Admin", AdminSchema);
export default AdminModel;
