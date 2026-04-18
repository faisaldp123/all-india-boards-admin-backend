const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  filterProducts,
  getRelatedProducts,
  getCustomersAlsoBought
} = require("../controllers/productController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");


// Get all products (pagination)
router.get("/", getProducts);

// Search products
router.get("/search", searchProducts);

// Filter products
router.get("/filter", filterProducts);

// Related products
router.get("/related/:id", getRelatedProducts);

// Customers also bought
router.get("/customers-also-bought/:id", getCustomersAlsoBought);

// Get single product
router.get("/:id", getProduct);

// Create product
router.post(
  "/",
  auth,
  admin,
  createProduct // ✅ removed multer
);


// Update product
router.put(
  "/:id",
  auth,
  admin,
  updateProduct // ✅ removed multer
);

// Delete product
router.delete("/:id", auth, admin, deleteProduct);

module.exports = router;