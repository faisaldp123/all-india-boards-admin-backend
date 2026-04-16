const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
    },

    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
    },

    orderStatus: {
      type: String,
      enum: ["Pending", "Packed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "Online"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    trackingId: String,
    courierName: String,
    trackingStatus: {
      type: String,
      default: "Not Shipped",
    },

  },
  { timestamps: true }
);

// ✅ IMPORTANT LINE (DO NOT CHANGE)
module.exports = mongoose.model("Order", orderSchema);