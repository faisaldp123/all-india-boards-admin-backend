const express = require("express");
const router = express.Router();

const { createPayment } = require("../controllers/paymentController");

router.post("/create-order", createPayment);

module.exports = router;