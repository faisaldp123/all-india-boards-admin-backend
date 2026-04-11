const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
  },
  { timestamps: true }
);

// ✅ AUTO GENERATE UNIQUE SLUG
categorySchema.pre("save", async function (next) {
  try {
    if (!this.name) return next();

    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;

    let count = 1;

    // 🔥 ensure slug is unique
    while (await mongoose.models.Category.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    this.slug = slug;

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Category", categorySchema);