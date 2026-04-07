const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

router.get("/", getCategories);

router.post("/", auth, admin, createCategory);

router.put("/:id", auth, admin, updateCategory);

router.delete("/:id", auth, admin, deleteCategory);

module.exports = router;