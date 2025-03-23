import express, { Request, Response } from "express";
import { authController } from "../controllers/AuthController";
import { vehicleController } from "../controllers/VehicleController";
import { partnerController } from "../controllers/PartnerController";
import { orderController } from "../controllers/OrderController";
import { statisticsController } from "../controllers/StatisticsController";

const router = express.Router();

//Authentication
router.post("/auth/login", authController.loginUser);
router.post("/auth/createUser", authController.createUser);
router.put("/auth/updateUser", authController.updateUser);

//Vehicle
router.post("/vehicle/createVehicle", vehicleController.createVehicle);
router.put("/vehicle/updateVehicle", vehicleController.updateVehicle);
router.delete("/vehicle/deleteVehicle", vehicleController.deleteVehicle);
router.get("/vehicle/getAllVehicle", vehicleController.getAllVehicle);
router.post("/vehicle/createBaoDuong", vehicleController.createBaoDuong);
router.put("/vehicle/updateBaoDuong", vehicleController.updateBaoDuong);
router.delete("/vehicle/deleteBaoDuong", vehicleController.deleteBaoDuong);
router.get("/vehicle/getAllBaoDuong", vehicleController.getAllBaoDuong);

//Partner
router.post("/partner/createPartner", partnerController.createPartner);
router.put("/partner/updatePartner", partnerController.updatePartner);
router.delete("/partner/deletePartner", partnerController.deletePartner);
router.get("/partner/getAllPartner", partnerController.getAllPartner);

//Order
router.post("/order/createOrder", orderController.createOrder);
router.put("/order/updateStatusOrder", orderController.updateStatusOrder);
router.delete("/order/deleteOrder", orderController.deleteOrder);
router.get("/order/getOrder", orderController.getOrder);

//Statistics
router.get("/statistics", statisticsController.statistic);

export default router;
