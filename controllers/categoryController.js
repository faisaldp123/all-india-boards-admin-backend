const Category = require("../models/Category");

const toSlug = (value) => String(value || "").trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.createCategory = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const slug = toSlug(req.body?.slug || name);
    const image = String(req.body?.image || "").trim();
    if (!name || !slug) return res.status(400).json({ message: "A category name is required" });

    const existing = await Category.findOne({
      $or: [{ name: { $regex: `^${escaped(name)}$`, $options: "i" } }, { slug }],
    });
    if (existing) return res.status(400).json({ message: "Category already exists" });

    res.status(201).json(await Category.create({ name, slug, image }));
  } catch (error) {
    res.status(500).json({ message: "Could not create category", error: error.message });
  }
};

exports.getCategories = async (_req, res) => {
  try {
    res.json(await Category.find().sort({ name: 1 }));
  } catch (error) {
    res.status(500).json({ message: "Could not get categories", error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const slug = toSlug(req.body?.slug || name);
    if (!name || !slug) return res.status(400).json({ message: "A category name is required" });

    const existing = await Category.findOne({
      _id: { $ne: req.params.id },
      $or: [{ name: { $regex: `^${escaped(name)}$`, $options: "i" } }, { slug }],
    });
    if (existing) return res.status(400).json({ message: "Category already exists" });

    const update = { name, slug };
    if (typeof req.body.image === "string") update.image = req.body.image.trim();
    const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Could not update category", error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete category", error: error.message });
  }
};
