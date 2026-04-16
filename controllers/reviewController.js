const Review = require("../models/Review");
const Product = require("../models/Product");

//
// 🔥 HELPER: UPDATE PRODUCT RATING
//
const updateProductRating = async (productId) => {
  const reviews = await Review.find({ productId });

  const total = reviews.reduce((acc, r) => acc + r.rating, 0);

  const avg = reviews.length ? total / reviews.length : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: avg,
    reviewCount: reviews.length,
  });
};

//
// ✅ ADD REVIEW (NO DUPLICATE + AUTO RATING)
//
exports.addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    // 🚫 Prevent duplicate review
    const existing = await Review.findOne({
      productId,
      userId: req.user.id,
    });

    if (existing) {
      return res.status(400).json({
        message: "You already reviewed this product",
      });
    }

    const review = await Review.create({
      userId: req.user.id,
      productId,
      rating,
      comment,
    });

    // ⭐ Update product rating
    await updateProductRating(productId);

    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

//
// ✅ GET ALL REVIEWS
//
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name email")
      .populate("productId", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
// ✅ LIKE REVIEW
//
exports.likeReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // already liked?
    if (review.likedBy.includes(req.user.id)) {
      return res.status(400).json({ message: "Already liked" });
    }

    review.likes += 1;
    review.likedBy.push(req.user.id);

    await review.save();

    res.json({ message: "Liked", likes: review.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
// ✅ DELETE REVIEW (SUPERADMIN)
//
exports.deleteReview = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        message: "Only superadmin can delete",
      });
    }

    const review = await Review.findById(req.params.id);

    await Review.findByIdAndDelete(req.params.id);

    // ⭐ Update rating after delete
    if (review) {
      await updateProductRating(review.productId);
    }

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
// 📊 ANALYTICS
//
exports.reviewStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};