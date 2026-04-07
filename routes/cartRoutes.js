const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  removeFromCart,
} = require("../controllers/cartController");

const auth = require("../middleware/authMiddleware");

router.post("/add", auth, addToCart);

router.get("/:userId", auth, getCart);

router.delete("/remove/:productId", auth, removeFromCart);

module.exports = router;