const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({ title: String, subtitle: String, image: String, href: String }, { _id: true });
const homeContentSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: "homepage" },
  heroSlides: [cardSchema],
  promoCards: [cardSchema],
  testimonials: [{ name: String, designation: String, quote: String, image: String }],
  countdown: { title: String, subtitle: String, endDate: String, image: String, href: String },
}, { timestamps: true });

module.exports = mongoose.model("HomeContent", homeContentSchema);
