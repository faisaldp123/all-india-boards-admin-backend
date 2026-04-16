const Razorpay = require("razorpay");

let razorpay;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  });
} else {
  console.warn("⚠️ Razorpay not configured");
}

// CREATE PAYMENT
exports.createPayment = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        message: "Payment service not configured",
      });
    }

    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
    });

    res.json(order);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};