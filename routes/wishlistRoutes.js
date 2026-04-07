const express = require("express");
const router = express.Router();

const {
  addToWishlist,
  getWishlist,
  removeFromWishlist
} = require("../controllers/wishlistController");

const auth = require("../middleware/authMiddleware");

router.post("/add", auth, addToWishlist);

router.get("/:userId", auth, getWishlist);

router.delete("/remove/:productId", auth, removeFromWishlist);

module.exports = router;