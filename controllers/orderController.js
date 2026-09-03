const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

/* =========================================================
   EMAIL VIA BREVO HTTP API
   Switched away from raw SMTP entirely. GoDaddy's SMTP relay
   (smtpout.secureserver.net) was reliably timing out on
   outbound connections from Render (network-level block, not
   a code issue - confirmed by testing every port/config).
   Brevo's API sends over plain HTTPS (port 443), which sidesteps
   that whole class of problem.
   Requires env vars: BREVO_API_KEY, SMTP_FROM (the verified
   sender address, e.g. support@allindiaboards.com)
========================================================= */

const sendViaBrevo = async ({ to, toName, subject, html, text }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.SMTP_FROM || "support@allindiaboards.com";

  if (!apiKey) {
    console.warn("[ORDER-EMAIL] SKIPPED: BREVO_API_KEY not configured");
    return;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "All India Boards Support", email: fromEmail },
      to: [{ email: to, name: toName || undefined }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API error ${res.status}: ${body}`);
  }

  return res.json();
};

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (amount) => `\u20b9${Number(amount || 0).toLocaleString("en-IN")}`;

const buildOrderEmailHtml = (order, customerName) => {
  const rows = (order.products || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.name || ""}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity || 0}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(
            Number(item.price || 0) * Number(item.quantity || 0)
          )}</td>
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

      <p style="margin-top:24px;">If you have any questions about your order, just reply to this email and our support team will help you.</p>
      <p style="margin-top:24px;">\u2014 Team All India Boards</p>
    </div>
  `;
};

/* =========================================================
   SEND ORDER CONFIRMATION EMAIL
========================================================= */

const sendOrderConfirmationEmail = async (order, customer) => {
  console.log(`[ORDER-EMAIL] Function called for order ${order._id}, customer:`, customer ? { name: customer.name, email: customer.email } : customer);

  if (!customer?.email) {
    console.warn("[ORDER-EMAIL] SKIPPED: customer has no email");
    return;
  }

  try {
    const result = await sendViaBrevo({
      to: customer.email,
      toName: customer.name,
      subject: `Order Confirmed - #${order._id}`,
      html: buildOrderEmailHtml(order, customer.name),
      text: `Thank you for your order #${order._id}. Total: ${formatCurrency(order.totalPrice)}. Payment Method: ${order.paymentMethod}. Order Status: ${order.orderStatus}. We'll notify you when your order ships. \u2014 Team All India Boards`,
    });

    console.log(`[ORDER-EMAIL] SUCCESS - Brevo messageId: ${result?.messageId || "n/a"}`);
  } catch (error) {
    console.error(`[ORDER-EMAIL] ERROR for order ${order._id}:`, error.message);
  }
};

/* =========================================================
   CREATE ORDER
========================================================= */

exports.createOrder = async (req, res) => {
  let stockChanges = [];

  try {
    const { products, shippingAddress, paymentMethod = "COD" } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    if (!["COD", "Online"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: "Shipping address is required" });
    }

    const requiredAddressFields = ["fullName", "phone", "address", "city", "state", "pincode"];
    for (const field of requiredAddressFields) {
      if (!String(shippingAddress[field] || "").trim()) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }

    let totalPrice = 0;
    const orderItems = [];

    for (const item of products) {
      if (!item?.productId) {
        return res.status(400).json({ success: false, message: "Invalid product in cart" });
      }

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, message: "Invalid product quantity" });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      if (Number(product.stock || 0) < quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }

      stockChanges.push({ product, quantity });

      product.stock -= quantity;
      await product.save();

      const price = Number(product.price || 0);
      orderItems.push({ productId: product._id, name: product.name, price, quantity });

      totalPrice += price * quantity;
    }

    const order = await Order.create({
      userId: req.user.id,
      products: orderItems,
      totalPrice,
      shippingAddress: {
        fullName: String(shippingAddress.fullName).trim(),
        phone: String(shippingAddress.phone).trim(),
        address: String(shippingAddress.address).trim(),
        city: String(shippingAddress.city).trim(),
        state: String(shippingAddress.state).trim(),
        pincode: String(shippingAddress.pincode).trim(),
      },
      paymentMethod,
      paymentStatus: "Pending",
    });

    const customer = await User.findById(req.user.id).select("name email");

    void sendOrderConfirmationEmail(order, customer).catch((error) => {
      console.error(`[ORDER-EMAIL] UNHANDLED ERROR for order ${order._id}:`, error?.message || error);
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
      _id: order._id,
    });

  } catch (error) {
    console.error("ORDER ERROR:", error);

    if (stockChanges.length > 0) {
      for (const change of stockChanges) {
        try {
          change.product.stock += change.quantity;
          await change.product.save();
        } catch (restoreError) {
          console.error("STOCK RESTORE ERROR:", restoreError?.message || restoreError);
        }
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to place order",
      error: error.message,
    });
  }
};

/* =========================================================
   USER ORDERS
========================================================= */

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("products.productId")
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    console.error("GET USER ORDERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch orders", error: error.message });
  }
};

/* =========================================================
   ADMIN ALL ORDERS
========================================================= */

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("products.productId")
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    console.error("GET ALL ORDERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch orders", error: error.message });
  }
};

/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

exports.updateOrderStatus = async (req, res) => {
  try {
    const allowed = ["Pending", "Packed", "Shipped", "Delivered", "Cancelled"];

    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const update = { orderStatus: req.body.status };
    if (req.body.status === "Shipped") update.trackingStatus = "Shipped";
    if (req.body.status === "Delivered") update.trackingStatus = "Delivered";
    if (req.body.status === "Cancelled") update.trackingStatus = "Cancelled";

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    return res.status(500).json({ success: false, message: "Unable to update order status", error: error.message });
  }
};

/* =========================================================
   ASSIGN TRACKING
========================================================= */

exports.assignTracking = async (req, res) => {
  try {
    const { trackingId, courierName, trackingUrl, estimatedDelivery } = req.body;

    if (!String(trackingId || "").trim()) {
      return res.status(400).json({ success: false, message: "Tracking ID is required" });
    }

    const update = {
      trackingId: String(trackingId).trim(),
      courierName: String(courierName || "").trim(),
      trackingUrl: String(trackingUrl || "").trim(),
      trackingStatus: "Shipped",
      orderStatus: "Shipped",
    };

    if (estimatedDelivery) {
      const date = new Date(estimatedDelivery);
      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid estimated delivery date" });
      }
      update.estimatedDelivery = date;
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    console.error("ASSIGN TRACKING ERROR:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    return res.status(500).json({ success: false, message: "Unable to assign tracking", error: error.message });
  }
};

/* =========================================================
   GET SINGLE ORDER
========================================================= */

exports.getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id })
      .populate("products.productId")
      .populate("userId", "name email");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    console.error("GET SINGLE ORDER ERROR:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    return res.status(500).json({ success: false, message: "Unable to fetch order", error: error.message });
  }
};