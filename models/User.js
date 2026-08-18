const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" },
  phone: { type: String, default: "" },
  address: { fullName: String, phone: String, address: String, city: String, state: String, pincode: String }
});

module.exports = mongoose.model("User", userSchema);
