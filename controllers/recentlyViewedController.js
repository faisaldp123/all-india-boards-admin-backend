const RecentlyViewed = require("../models/RecentlyViewed");



// Add viewed product
exports.addRecentlyViewed = async (req, res) => {

  try {

    const { userId, productId } = req.body;

    let recentlyViewed = await RecentlyViewed.findOne({ userId });

    if (!recentlyViewed) {

      recentlyViewed = new RecentlyViewed({
        userId,
        products: []
      });

    }

    // Remove if already exists
    recentlyViewed.products = recentlyViewed.products.filter(
      item => item.productId.toString() !== productId
    );

    // Add to beginning
    recentlyViewed.products.unshift({ productId });

    // Limit to 10 products
    recentlyViewed.products = recentlyViewed.products.slice(0, 10);

    await recentlyViewed.save();

    res.json(recentlyViewed);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



// Get recently viewed
exports.getRecentlyViewed = async (req, res) => {

  try {

    const recentlyViewed = await RecentlyViewed.findOne({
      userId: req.params.userId
    }).populate("products.productId");

    res.json(recentlyViewed);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};