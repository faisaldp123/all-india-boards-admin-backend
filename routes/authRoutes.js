const express = require("express");
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  getUsers
} = require("../controllers/authController");

router.post("/register", register);
router.post("/register", register);
router.post("/getUsers", getUsers);
router.post("/admin-login", adminLogin);

module.exports = router;