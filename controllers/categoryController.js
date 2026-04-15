const Category = require("../models/Category");

// ✅ CREATE CATEGORY
exports.createCategory = async (req, res) => {
  try {
    console.log("🔥 BODY:", req.body);

    let { name } = req.body || {};

    // ✅ Trim & normalize
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    name = name.trim();

    // ✅ Case-insensitive check (important)
    const existing = await Category.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (existing) {
      return res.status(400).json({
        message: "Category already exists",
      });
    }

    const category = new Category({ name });
    await category.save();

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("❌ CREATE ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate category or slug",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error while creating category",
      error: error.message,
    });
  }
};

// ✅ GET ALL
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.json(categories);
  } catch (error) {
    console.error("❌ FETCH ERROR:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

// ✅ UPDATE CATEGORY
exports.updateCategory = async (req, res) => {
  try {
    let { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    name = name.trim();

    // ✅ Prevent duplicate (excluding current ID)
    const existing = await Category.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: req.params.id },
    });

    if (existing) {
      return res.status(400).json({
        message: "Category with this name already exists",
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("❌ UPDATE ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate category or slug",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Update failed",
      error: error.message,
    });
  }
};

// ✅ DELETE CATEGORY
exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("❌ DELETE ERROR:", error);

    res.status(500).json({
      message: "Delete failed",
      error: error.message,
    });
  }
};