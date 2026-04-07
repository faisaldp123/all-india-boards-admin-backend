const Order = require("../models/Order");
const Product = require("../models/Product");


// Create Order
exports.createOrder = async (req, res) => {

  try {

    const { userId, products, totalPrice, shippingAddress } = req.body;

    for (let item of products) {

      const product = await Product.findById(item.productId);

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: "Product out of stock"
        });
      }

      product.stock -= item.quantity;

      await product.save();
    }

    const order = new Order({
      userId,
      products,
      totalPrice,
      shippingAddress
    });

    await order.save();

    res.json(order);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



// Get Orders for Logged User
exports.getUserOrders = async (req, res) => {

  try {

    const orders = await Order.find({
      userId: req.params.userId
    }).populate("products.productId");

    res.json(orders);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



// Admin: Get All Orders
exports.getAllOrders = async (req, res) => {

  try {

    const orders = await Order.find()
      .populate("userId")
      .populate("products.productId");

    res.json(orders);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



// Admin: Update Order Status
exports.updateOrderStatus = async (req, res) => {

  try {

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: req.body.status },
      { new: true }
    );

    res.json(order);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};