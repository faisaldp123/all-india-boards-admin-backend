const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true },
    image: { type: String, default: "" },
    isFeatured: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.pre("save", function () {
  if (this.name) this.slug = slugify(this.name, { lower: true, strict: true });
});

categorySchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (update?.name) {
    update.slug = slugify(update.name, { lower: true, strict: true });
    this.setUpdate(update);
  }
});

module.exports = mongoose.model("Category", categorySchema);
