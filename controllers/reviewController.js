const Review = require("../models/Review");



// ADD REVIEW
exports.addReview = async (req, res) => {

  try {

    const { userId, productId, rating, comment } = req.body;

    const review = new Review({
      userId,
      productId,
      rating,
      comment
    });

    await review.save();

    res.json(review);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



// GET PRODUCT REVIEWS
exports.getProductReviews = async (req, res) => {

  try {

    const reviews = await Review.find({
      productId: req.params.productId
    }).populate("userId", "name");

    res.json(reviews);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



// DELETE REVIEW
exports.deleteReview = async (req, res) => {

  try {

    await Review.findByIdAndDelete(req.params.id);

    res.json({
      message: "Review deleted successfully"
    });

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};