import express from "express";
import { authController } from "../controllers/AuthController";
import { locationController } from "../controllers/LocationController";
import { optimizationController } from "../controllers/OptimizationController";
import { orderController } from "../controllers/OrderController";
import { partnerController } from "../controllers/PartnerController";
import { statisticsController } from "../controllers/StatisticsController";
import { vehicleController } from "../controllers/VehicleController";

const router = express.Router();
//Authentication
router.post("/auth/login", authController.loginUser);
router.post("/auth/createUser", authController.createUser);
router.put("/auth/updateUser", authController.updateUser);
router.get("/auth/users", authController.getAllUsers);
router.get("/auth/userDetail", authController.getUserDetail);
router.delete("/auth/deleteUser", authController.deleteUser);
router.get("/auth/search", authController.searchUser);

//Vehicle
router.post("/vehicle/createVehicle", vehicleController.createVehicle);
router.put("/vehicle/updateVehicle", vehicleController.updateVehicle);
router.delete("/vehicle/deleteVehicle", vehicleController.deleteVehicle);
router.get("/vehicle/getAllVehicle", vehicleController.getAllVehicle);
router.post("/vehicle/createBaoDuong", vehicleController.createBaoDuong);
router.put("/vehicle/updateBaoDuong", vehicleController.updateBaoDuong);
router.delete("/vehicle/deleteBaoDuong", vehicleController.deleteBaoDuong);
router.get("/vehicle/getAllBaoDuong", vehicleController.getAllBaoDuong);
router.get("/vehicle/seachVehicle", vehicleController.searchVehicles);
router.get("/vehicle/seachMantaince", vehicleController.searchMantainces);

//Partner
router.post("/partner/createPartner", partnerController.createPartner);
router.put("/partner/updatePartner", partnerController.updatePartner);
router.delete("/partner/deletePartner", partnerController.deletePartner);
router.get("/partner/getAllPartner", partnerController.getAllPartner);
router.get("/partner/search", partnerController.searchPartners);

//Order
router.post("/order/createOrder", orderController.createOrder);
router.put("/order/updateStatusOrder", orderController.updateStatusOrder);
router.delete("/order/deleteOrder", orderController.deleteOrder);
router.get("/order/getOrder", orderController.getOrder);
router.get("/order/getOrderDetail", orderController.getOrderDetail);
router.get("/order/search", orderController.searchOrders);

//Statistics
router.get("/statistics", statisticsController.statistic);

//Algorithms
router.post("/optimize/route", optimizationController.optimizeRoute);
router.get("/optimize/delivery_route", optimizationController.getDeliveryRoute);
router.get("/optimize/demo", optimizationController.demoAlgorithms);

// Location=
router.post("/location/create", locationController.createLocation);
router.get("/location/all", locationController.getAllLocations);
router.get("/location/search", locationController.searchLocations);
router.get("/location/get/:id", locationController.getLocationById);
router.put("/location/update/:id", locationController.updateLocation);
router.delete("/location/delete/:id", locationController.deleteLocation);

export default router;
