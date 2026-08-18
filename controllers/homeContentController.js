const HomeContent = require("../models/HomeContent");

exports.getHomeContent = async (_req, res) => {
  try {
    const content = await HomeContent.findOneAndUpdate({ key: "homepage" }, { $setOnInsert: { key: "homepage" } }, { new: true, upsert: true });
    res.json(content);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateHomeContent = async (req, res) => {
  try {
    const allowed = ["heroSlides", "promoCards", "testimonials", "countdown"];
    const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const content = await HomeContent.findOneAndUpdate({ key: "homepage" }, { $set: update, $setOnInsert: { key: "homepage" } }, { new: true, upsert: true, runValidators: true });
    res.json(content);
  } catch (error) { res.status(400).json({ message: error.message }); }
};
