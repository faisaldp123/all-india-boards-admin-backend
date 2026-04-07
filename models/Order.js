const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      },
      quantity: Number
    }
  ],

  totalPrice: Number,

  shippingAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String
  },

  orderStatus: {
    type: String,
    enum: ["Pending", "Packed", "Shipped", "Delivered", "Cancelled"],
    default: "Pending"
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);