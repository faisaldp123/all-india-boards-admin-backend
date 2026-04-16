const express = require("express");
const router = express.Router();

const {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus
} = require("../controllers/orderController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// ✅ Create order (user)
router.post("/", auth, createOrder);

// ✅ Get logged-in user's orders
router.get("/my-orders", auth, getUserOrders);

// ✅ Admin: get all orders
router.get("/", auth, admin, getAllOrders);

// ✅ Admin: update order status
router.put("/:id/status", auth, admin, updateOrderStatus);

module.exports = router;