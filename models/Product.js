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
      index: true,
    },

    description: String,
    brand: String,
    modelNumber: String,

    price: {
      type: Number,
      required: true,
    },

    stock: {
      type: Number,
      default: 0,
    },

    images: {
      type: [String],
      default: [],
    },

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

//
// ✅ FIXED SLUG GENERATION (NO next())
//

productSchema.pre("save", function () {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

//
// ✅ FIX FOR UPDATE (IMPORTANT)
//

productSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update?.name) {
    update.slug = slugify(update.name, { lower: true, strict: true });
    this.setUpdate(update);
  }
});

//
// 🔎 Search Index
//

productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  modelNumber: "text",
  "specifications.boardNumber": "text",
});

module.exports = mongoose.model("Product", productSchema);