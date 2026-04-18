const Product = require("../models/Product");
const Order = require("../models/Order");

// Create Product (UPDATED FOR MULTIPLE IMAGES)
exports.createProduct = async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      images: req.body.images || [] // ✅ from frontend (Cloudinary URLs)
    });

    await product.save();

    res.json(product);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get All Products with Pagination
exports.getProducts = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const skip = (page - 1) * limit;

    const products = await Product.find()
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments();

    res.json({
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      products
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get Single Product
exports.getProduct = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id)
      .populate("category");

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Update Product
exports.updateProduct = async (req, res) => {
  try {

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(product);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Delete Product
exports.deleteProduct = async (req, res) => {
  try {

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: "Product deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Search Products
exports.searchProducts = async (req, res) => {
  try {

    const keyword = req.query.keyword;

    const products = await Product.find({
      $text: { $search: keyword }
    }).populate("category");

    res.json(products);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Filter Products
exports.filterProducts = async (req, res) => {
  try {

    const { brand, minPrice, maxPrice, category } = req.query;

    let filter = {};

    if (brand) filter.brand = brand;
    if (category) filter.category = category;

    if (minPrice || maxPrice) {
      filter.price = {
        $gte: Number(minPrice) || 0,
        $lte: Number(maxPrice) || 100000
      };
    }

    const products = await Product.find(filter)
      .populate("category");

    res.json(products);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Related Products
exports.getRelatedProducts = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id);

    const relatedProducts = await Product.find({
      category: product.category,
      brand: product.brand,
      _id: { $ne: product._id }
    })
      .limit(6)
      .populate("category");

    res.json(relatedProducts);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Customers Also Bought
exports.getCustomersAlsoBought = async (req, res) => {
  try {

    const productId = req.params.id;

    const orders = await Order.find({
      "products.productId": productId
    });

    let productIds = [];

    orders.forEach(order => {
      order.products.forEach(item => {
        if (item.productId.toString() !== productId) {
          productIds.push(item.productId);
        }
      });
    });

    const uniqueIds = [...new Set(productIds)];

    const recommendedProducts = await Product.find({
      _id: { $in: uniqueIds }
    }).limit(6);

    res.json(recommendedProducts);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};