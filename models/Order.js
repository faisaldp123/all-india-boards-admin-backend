const Order = require("../models/Order");
const Product = require("../models/Product");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalPrice = 0;
    let orderItems = [];

    for (let item of products) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: "Out of stock" });
      }

      // reduce stock
      product.stock -= item.quantity;
      await product.save();

      // snapshot
      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });

      totalPrice += product.price * item.quantity;
    }

    const order = await Order.create({
      userId: req.user.id, // ✅ secure
      products: orderItems,
      totalPrice,
      shippingAddress,
      paymentMethod,
    });

    res.status(201).json(order);

  } catch (error) {
    console.error("ORDER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// USER ORDERS
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("products.productId");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADMIN ALL ORDERS
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("products.productId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE STATUS
exports.updateOrderStatus = async (req, res) => {
  try {
    const allowed = ["Pending", "Packed", "Shipped", "Delivered", "Cancelled"];

    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

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