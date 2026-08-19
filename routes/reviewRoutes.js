const express = require("express");
const router = express.Router();

const {
  addReview,
  getAllReviews,
  deleteReview,
  likeReview,
  reviewStats,
} = require("../controllers/reviewController");

const auth = require("../middleware/authMiddleware");

router.post("/add", auth, addReview);
router.get("/", getAllReviews);

router.post("/like/:id", auth, likeReview); // 👍
router.get("/stats", reviewStats); // 📊

router.delete("/:id", auth, deleteReview);

module.exports = router;