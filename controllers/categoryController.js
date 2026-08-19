const Category = require("../models/Category");
const slugify = require("slugify");

const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const categorySlug = (name) => slugify(name, { lower: true, strict: true });

exports.createCategory = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const image = typeof req.body?.image === "string" ? req.body.image.trim() : "";
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const slug = categorySlug(name);
    const existing = await Category.findOne({ $or: [{ slug }, { name: { $regex: `^${escaped(name)}$`, $options: "i" } }] });
    if (existing) return res.status(400).json({ message: "Category already exists" });

    const category = await Category.create({ name, slug, image });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Could not create category", error: error.message });
  }
};

exports.getCategories = async (_req, res) => {
  try {
    res.json(await Category.find().sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: "Could not fetch categories", error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const slug = categorySlug(name);
    const existing = await Category.findOne({ _id: { $ne: req.params.id }, $or: [{ slug }, { name: { $regex: `^${escaped(name)}$`, $options: "i" } }] });
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
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete category", error: error.message });
  }
};
