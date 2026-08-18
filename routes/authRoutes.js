const express = require("express");
const router = express.Router();

const {
  register,
  login,
  adminLogin,
  getUsers,
  getProfile,
  updateProfile
} = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

// USER
router.post("/register", register);
router.post("/login", login);

// ADMIN
router.post("/admin-login", adminLogin);

// ✅ FIXED ROUTE
router.get("/users", getUsers);
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);

module.exports = router;
