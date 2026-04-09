const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
    },

    description: {
      type: String,
    },

    brand: {
      type: String,
    },

    modelNumber: {
      type: String,
    },

    price: {
      type: Number,
      required: true,
    },

    stock: {
      type: Number,
      default: 0,
    },

    images: [String],

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    rating: {
      type: Number,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    // 🔧 Specifications
    specifications: {
      boardNumber: String,
      compatibleBrand: String,
      screenSize: String,
      resolution: String,
      panelType: String,
      ports: String,
    },

    // 🌐 SEO Fields
    seo: {
      metaTitle: String,
      metaDescription: String,
      ogImage: String,
      siteUrl: String,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 Auto slug generate
productSchema.pre("save", function (next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

// 🔎 Search Index
productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  modelNumber: "text",
  "specifications.boardNumber": "text",
});

module.exports = mongoose.model("Product", productSchema);