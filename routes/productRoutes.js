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
  upload.array("images", 5),
  createProduct
);

// Update product
router.put(
  "/:id",
  auth,
  admin,
  upload.array("images", 5),
  updateProduct
);

// Delete product
router.delete("/:id", auth, admin, deleteProduct);

module.exports = router;