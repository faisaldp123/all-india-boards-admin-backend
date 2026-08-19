const express = require("express");
const router = express.Router();

const {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  assignTracking,
  getSingleOrder
} = require("../controllers/orderController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// CREATE ORDER
router.post("/", auth, createOrder);

// USER ORDERS
router.get("/my-orders", auth, getUserOrders);

// ADMIN ALL ORDERS
router.get("/", auth, admin, getAllOrders);

// UPDATE STATUS
router.put("/:id/status", auth, admin, updateOrderStatus);

// 🚚 TRACKING
router.put("/:id/tracking", auth, admin, assignTracking);

// 📱 GET SINGLE ORDER
router.get("/:id", auth, getSingleOrder);

module.exports = router;