const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: {
    type: String,
    default: "admin",
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
});

module.exports = mongoose.model("Admin", adminSchema);
