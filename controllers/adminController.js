const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

exports.getDashboardStats = async (req, res) => {
  try {

    // ✅ COUNTS
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // ✅ TOTAL REVENUE
    const revenueData = await Order.aggregate([
      {
        $match: { paymentStatus: "Paid" }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    // ✅ MONTHLY REVENUE
    const monthlyRevenue = await Order.aggregate([
      {
        $match: { paymentStatus: "Paid" }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // ✅ MONTHLY ORDERS
    const monthlyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // ✅ ORDER STATUS DISTRIBUTION
    const orderStatusStats = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    // ✅ LOW STOCK PRODUCTS
    const lowStockProducts = await Product.find({
      stock: { $lt: 5 }
    }).select("name stock");

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      monthlyRevenue,
      monthlyOrders,
      orderStatusStats,
      lowStockProducts
    });

  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};