import express, { Request, Response } from "express";
import { authController } from "../controllers/AuthController";
import { vehicleController } from "../controllers/VehicleController";
import { partnerController } from "../controllers/PartnerController";

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

//Partner
router.post("/partner/createPartner", partnerController.createPartner);
router.post("/partner/updatePartner", partnerController.updatePartner);
router.delete("/partner/deletePartner", partnerController.deletePartner);
router.get("/partner/getAllPartner", partnerController.getAllPartner);

export default router;
