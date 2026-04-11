const Category = require("../models/Category");

// ✅ CREATE CATEGORY
exports.createCategory = async (req, res) => {
  try {
    console.log("🔥 BODY:", req.body);

    const { name } = req.body || {};

    if (!name) {
      return res.status(400).json({ message: "Name required" });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = new Category({ name });
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    console.error("❌ ERROR:", error);

    // 🔥 Handle duplicate key error (slug or name)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate category or slug",
      });
    }

    // 🔥 Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    // 🔥 Fallback
    res.status(500).json({
      message: "Server error while creating category",
      error: error.message,
    });
  }
};

// ✅ GET ALL
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories" });
  }
};

// ✅ UPDATE
exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true } // ✅ runValidators ensures schema rules apply
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("❌ UPDATE ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({ message: "Duplicate category or slug" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// ✅ DELETE
exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error("❌ DELETE ERROR:", error);
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};