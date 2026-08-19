const router = require("express").Router();
const { getHomeContent, updateHomeContent } = require("../controllers/homeContentController");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
router.get("/", getHomeContent);
router.put("/", auth, admin, updateHomeContent);
module.exports = router;
