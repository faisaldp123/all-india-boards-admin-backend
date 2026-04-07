const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: String,
  slug: String
});

module.exports = mongoose.model("Category", categorySchema);