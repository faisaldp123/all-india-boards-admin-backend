const express = require("express");
const router = express.Router();

const {
  addReview,
  getProductReviews,
  deleteReview
} = require("../controllers/reviewController");

const auth = require("../middleware/authMiddleware");


// add review
router.post("/add", auth, addReview);

// get reviews for product
router.get("/product/:productId", getProductReviews);

// delete review
router.delete("/:id", auth, deleteReview);

module.exports = router;