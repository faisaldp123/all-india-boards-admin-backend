const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true, // ✅ allows multiple nulls, avoids duplicate index errors
    },
  },
  { timestamps: true }
);

// ✅ Generate slug before saving
categorySchema.pre("save", function (next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

// ✅ Also generate slug when updating with findOneAndUpdate
categorySchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.name) {
    update.slug = slugify(update.name, { lower: true });
    this.setUpdate(update);
  }
  next();
});

module.exports = mongoose.model("Category", categorySchema);