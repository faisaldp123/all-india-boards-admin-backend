const express = require("express");
const router = express.Router();

const {
  addRecentlyViewed,
  getRecentlyViewed
} = require("../controllers/recentlyViewedController");

const auth = require("../middleware/authMiddleware");


// Add viewed product
router.post("/", auth, addRecentlyViewed);


// Get recently viewed
router.get("/:userId", auth, getRecentlyViewed);


module.exports = router;