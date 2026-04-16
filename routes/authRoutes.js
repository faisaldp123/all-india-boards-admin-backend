const express = require("express");
const router = express.Router();

const {
  register,
  login,
  adminLogin,
  getUsers
} = require("../controllers/authController");

// USER
router.post("/register", register);
router.post("/login", login);

// ADMIN
router.post("/admin-login", adminLogin);

// ✅ FIXED ROUTE
router.get("/users", getUsers);

module.exports = router;