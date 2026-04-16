const express = require("express");
const router = express.Router();

const { createPayment } = require("../controllers/paymentController");
const auth = require("../middleware/authMiddleware");

router.post("/create", auth, createPayment);

module.exports = router;