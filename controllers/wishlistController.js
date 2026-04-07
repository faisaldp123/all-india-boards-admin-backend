const Wishlist = require("../models/Wishlist");



// ADD TO WISHLIST
exports.addToWishlist = async (req, res) => {

  try {

    const { userId, productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId,
        products: []
      });
    }

    const exists = wishlist.products.find(
      p => p.toString() === productId
    );

    if (!exists) {
      wishlist.products.push(productId);
    }

    await wishlist.save();

    res.json(wishlist);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



// GET WISHLIST
exports.getWishlist = async (req, res) => {

  try {

    const wishlist = await Wishlist.findOne({
      userId: req.params.userId
    }).populate("products");

    if (!wishlist) {
      return res.json({ products: [] });
    }

    res.json(wishlist);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



// REMOVE FROM WISHLIST
exports.removeFromWishlist = async (req, res) => {

  try {

    const { userId } = req.body;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found"
      });
    }

    wishlist.products = wishlist.products.filter(
      p => p.toString() !== req.params.productId
    );

    await wishlist.save();

    res.json(wishlist);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};