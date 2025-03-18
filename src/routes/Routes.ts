import express, { Request, Response } from "express";
import { authController } from "../controllers/AuthController";
import { vehicleController } from "../controllers/VehicleController";

const router = express.Router();

//Authentication
router.post("/auth/login", authController.loginUser);
router.post("/auth/createUser", authController.createUser);
router.post("/auth/updateUser", authController.updateUser);

//Vehicle
router.post("/vehicle/createVehicle", vehicleController.createVehicle);
router.post("/vehicle/updateVehicle", vehicleController.updateVehicle);
router.delete("/vehicle/deleteVehicle", vehicleController.deleteVehicle);
router.get("/vehicle/getAllVehicle", vehicleController.getAllVehicle);
router.post("/vehicle/createBaoDuong", vehicleController.createBaoDuong);
router.post("/vehicle/updateBaoDuong", vehicleController.updateBaoDuong);
router.delete("/vehicle/deleteBaoDuong", vehicleController.deleteBaoDuong);
router.get("/vehicle/getAllBaoDuong", vehicleController.getAllBaoDuong);

export default router;
