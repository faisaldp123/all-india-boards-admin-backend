const User = require("../models/User");
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ================= USER =================

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    password: hashed,
  });

  await user.save();

  res.json(user);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(404).json("User not found");

  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.status(400).json("Wrong password");

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token, user });
};

// ================= ADMIN =================

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Incoming email:", email); // 🔍 debug

    const admin = await Admin.findOne({ email });

    console.log("Admin found:", admin); // 🔍 debug

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, role: admin.role });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};