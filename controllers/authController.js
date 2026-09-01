const User = require("../models/User");
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const resetAccount = (type) => type === "admin" ? Admin : User;

const mailTransport = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

exports.requestPasswordReset = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const accountType = req.body.accountType === "admin" ? "admin" : "user";
    if (!email) return res.status(400).json({ message: "Email is required" });

    const Account = resetAccount(accountType);
    const account = await Account.findOne({ email });
    // Keep the response identical so this route cannot be used to discover accounts.
    if (!account) return res.json({ message: "If an account exists, a reset link has been sent." });
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(503).json({ message: "Password reset email is not configured yet." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    account.passwordResetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    account.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await account.save();

    const appUrl = accountType === "admin"
      ? (process.env.ADMIN_APP_URL || "http://localhost:3000")
      : (process.env.USER_APP_URL || "http://localhost:3001");
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}&type=${accountType}`;
    await mailTransport().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: account.email,
      subject: "Reset your password",
      text: `Reset your password using this link (valid for 15 minutes): ${resetUrl}`,
      html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 15 minutes.</p>`,
    });
    res.json({ message: "If an account exists, a reset link has been sent." });
  } catch (error) {
    console.error("PASSWORD RESET REQUEST ERROR:", error);
    res.status(500).json({ message: "Could not send reset email" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const accountType = req.body.accountType === "admin" ? "admin" : "user";
    if (!token || !password || password.length < 8) return res.status(400).json({ message: "Use a reset token and a password of at least 8 characters." });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const Account = resetAccount(accountType);
    const account = await Account.findOne({ passwordResetToken: tokenHash, passwordResetExpires: { $gt: new Date() } });
    if (!account) return res.status(400).json({ message: "This reset link is invalid or has expired." });
    account.password = await bcrypt.hash(password, 10);
    account.passwordResetToken = undefined;
    account.passwordResetExpires = undefined;
    await account.save();
    res.json({ message: "Password updated. You can now sign in." });
  } catch (error) {
    console.error("PASSWORD RESET ERROR:", error);
    res.status(500).json({ message: "Could not reset password" });
  }
};

//
// ================= USER REGISTER =================
//

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Hash password
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Register error" });
  }
};

//
// ================= USER LOGIN =================
//

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login error" });
  }
};

//
// ================= ADMIN LOGIN =================
//

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

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

    // ✅ Cookie (Production safe)
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ✅ FIXED
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Admin login successful",
      token,
      role: admin.role,
    });

  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//
// ================= GET USERS (FOR ADMIN PANEL) =================
//

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const allowed = ["name", "phone", "address"];
  const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true }).select("-password");
  res.json(user);
};
