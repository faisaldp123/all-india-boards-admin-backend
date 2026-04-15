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
      sparse: true,
    },
  },
  { timestamps: true }
);

// ✅ Generate slug before saving (NO next needed)
categorySchema.pre("save", function () {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

// ✅ Generate slug on update (safe handling)
categorySchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update?.name) {
    update.slug = slugify(update.name, { lower: true, strict: true });
    this.setUpdate(update);
  }
});

module.exports = mongoose.model("Category", categorySchema);