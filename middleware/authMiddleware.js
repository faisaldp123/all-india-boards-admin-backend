const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    // ✅ Extract token (REMOVE "Bearer ")
    const token = authHeader.split(" ")[1];

    // ✅ Verify with SAME secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Attach user/admin
    req.user = decoded;

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};