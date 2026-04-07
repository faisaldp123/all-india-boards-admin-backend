const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

exports.createPayment = async (req, res) => {

  const options = {
    amount: req.body.amount * 100,
    currency: "INR",
    receipt: "order_receipt",
  };

  const order = await razorpay.orders.create(options);

  res.json(order);
};