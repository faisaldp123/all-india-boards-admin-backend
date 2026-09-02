const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const nodemailer = require("nodemailer");

// Reuses the same SMTP setup pattern as authController.js.
// Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to already be set
// in your environment (same ones used for the password-reset emails).
const mailTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

const formatCurrency = (amount) => `\u20b9${Number(amount || 0).toLocaleString("en-IN")}`;

const buildOrderEmailHtml = (order, customerName) => {
  const rows = order.products
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");

  const addr = order.shippingAddress || {};

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <h2 style="color:#1F4E78;">Thank you for your order${customerName ? `, ${customerName}` : ""}!</h2>
      <p>Your order has been placed successfully. Here are the details:</p>

      <p style="margin:4px 0;"><strong>Order ID:</strong> ${order._id}</p>
      <p style="margin:4px 0;"><strong>Payment Method:</strong> ${order.paymentMethod || "N/A"}</p>
      <p style="margin:4px 0;"><strong>Order Status:</strong> ${order.orderStatus || "Pending"}</p>

      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px 12px;text-align:left;">Product</th>
            <th style="padding:8px 12px;text-align:center;">Qty</th>
            <th style="padding:8px 12px;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px;text-align:right;font-weight:bold;">Total</td>
            <td style="padding:12px;text-align:right;font-weight:bold;">${formatCurrency(order.totalPrice)}</td>
          </tr>
        </tfoot>
      </table>

      <h3 style="margin-top:24px;">Shipping Address</h3>
      <p style="margin:0;">
        ${addr.fullName || ""}<br/>
        ${addr.address || ""}<br/>
        ${addr.city || ""}, ${addr.state || ""} ${addr.pincode || ""}<br/>
        Phone: ${addr.phone || ""}
      </p>

      <p style="margin-top:24px;">If you have any questions about your order, just reply to this email and our support team will help you out.</p>
      <p style="margin-top:24px;">— Team All India Boards</p>
    </div>
  `;
};

const sendOrderConfirmationEmail = async (order, customer) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("ORDER EMAIL SKIPPED: SMTP not configured");
    return;
  }
  if (!customer?.email) {
    console.warn("ORDER EMAIL SKIPPED: customer has no email on file");
    return;
  }

  try {
    await mailTransport().sendMail({
      from: '"All India Boards Support" <support@allindiaboards.com>',
      to: customer.email,
      subject: `Order Confirmed - #${order._id}`,
      html: buildOrderEmailHtml(order, customer.name),
      text: `Thank you for your order #${order._id}. Total: ${formatCurrency(order.totalPrice)}. We'll notify you when it ships.`,
    });
  } catch (error) {
    // Email failure should never block the order response - just log it.
    console.error("ORDER CONFIRMATION EMAIL ERROR:", error);
  }
};

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalPrice = 0;
    let orderItems = [];

    for (let item of products) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: "Out of stock" });
      }

      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });

      totalPrice += product.price * item.quantity;
    }

    const order = await Order.create({
      userId: req.user.id,
      products: orderItems,
      totalPrice,
      shippingAddress,
      paymentMethod,
    });

    // Fire the confirmation email after the order is safely saved.
    // Wrapped so an email failure never breaks the order response.
    const customer = await User.findById(req.user.id).select("name email");
    sendOrderConfirmationEmail(order, customer);

    res.status(201).json(order);

  } catch (error) {
    console.error("ORDER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// USER ORDERS
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("products.productId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADMIN ALL ORDERS
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("products.productId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE STATUS
exports.updateOrderStatus = async (req, res) => {
  try {
    const allowed = ["Pending", "Packed", "Shipped", "Delivered", "Cancelled"];

    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: req.body.status },
      { new: true }
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🚚 ASSIGN TRACKING
exports.assignTracking = async (req, res) => {
  try {
    const { trackingId, courierName } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        trackingId,
        courierName,
        trackingStatus: "Shipped",
      },
      { new: true }
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📱 GET SINGLE ORDER
exports.getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("products.productId")
      .populate("userId", "name email");

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};