const Cart = require("../models/Cart");



// ADD TO CART
exports.addToCart = async (req, res) => {

  try {

    const { userId, productId, quantity } = req.body;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: []
      });
    }

    const existingItem = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();

    res.json(cart);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



// GET USER CART
exports.getCart = async (req, res) => {

  try {

    const cart = await Cart.findOne({
      userId: req.params.userId
    }).populate("items.productId");

    if (!cart) {
      return res.json({ items: [] });
    }

    res.json(cart);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



// REMOVE FROM CART
exports.removeFromCart = async (req, res) => {

  try {

    const { userId } = req.body;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== req.params.productId
    );

    await cart.save();

    res.json(cart);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};