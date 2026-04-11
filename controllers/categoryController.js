const Category = require("../models/Category");

// ✅ CREATE CATEGORY
exports.createCategory = async (req, res) => {
  try {
    console.log("🔥 API HIT");
    console.log("🔥 BODY:", req.body);

    // ✅ safety check
    if (!req.body) {
      return res.status(400).json({ message: "No body received" });
    }

    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Category name required" });
    }

    const Category = require("../models/Category");

    // ✅ prevent duplicate crash
    const existing = await Category.findOne({ name: name.trim() });

    if (existing) {
      return res.status(400).json({
        message: "Category already exists",
      });
    }

    const category = new Category({
      name: name.trim(),
    });

    const saved = await category.save();

    console.log("✅ SAVED:", saved);

    res.status(201).json(saved);

  } catch (error) {
    console.error("❌ REAL ERROR 👉", error);

    res.status(500).json({
      message: "Server error",
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
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

// ✅ DELETE
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};