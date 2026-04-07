const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      unique: true
    },

    description: {
      type: String
    },

    brand: {
      type: String
    },

    modelNumber: {
      type: String
    },

    price: {
      type: Number,
      required: true
    },

    stock: {
      type: Number,
      default: 0
    },

    images: [String],

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    rating: {
      type: Number,
      default: 0
    },

    reviewCount: {
      type: Number,
      default: 0
    },

    // 🔧 Product Specifications
    specifications: {
      boardNumber: {
        type: String
      },

      compatibleBrand: {
        type: String
      },

      screenSize: {
        type: String
      },

      resolution: {
        type: String
      },

      panelType: {
        type: String
      },

      ports: {
        type: String
      }
    }

  },
  {
    timestamps: true
  }
);


// 🔎 Text Search Index
productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  modelNumber: "text",
  "specifications.boardNumber": "text"
});

module.exports = mongoose.model("Product", productSchema);