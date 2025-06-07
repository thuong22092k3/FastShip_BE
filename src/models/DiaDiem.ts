import { Schema, model } from "mongoose";
import { IDiaDiem } from "../interfaces/DiaDiem";

const DiaDiemSchema = new Schema<IDiaDiem>({
  DiaDiemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  district: { type: String, required: true },
  province: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
}); ///
const DiaDiemModel = model<IDiaDiem>("DiaDiem", DiaDiemSchema);
export default DiaDiemModel;
