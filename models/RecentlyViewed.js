const mongoose = require("mongoose");

const recentlyViewedSchema = new mongoose.Schema({
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
      viewedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.model("RecentlyViewed", recentlyViewedSchema);