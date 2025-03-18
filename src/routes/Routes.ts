import express, { Request, Response } from "express";
import { authController } from "../controllers/AuthController";
import { vehicleController } from "../controllers/VehicleController";

const router = express.Router();

//Authentication
router.post("/login", authController.loginUser);

//Vehicle
router.post("/addVehicle", vehicleController.addVehicle);
router.post("/updateVehicle", vehicleController.updateVehicle);
router.delete("/deleteVehicle", vehicleController.deleteVehicle);

export default router;
