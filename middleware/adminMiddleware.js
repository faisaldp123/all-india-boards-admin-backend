const User = require("../models/User");

module.exports = function (req, res, next) {
  try {
    console.log("USER ROLE 👉", req.user.role); // debug

    // ✅ Allow both admin & superadmin
    if (
      req.user.role !== "admin" &&
      req.user.role !== "superadmin"
    ) {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    next();
  } catch (error) {
    console.error("ADMIN MIDDLEWARE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};