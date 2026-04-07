const PDFDocument = require("pdfkit");
const fs = require("fs");

function generateInvoice(order) {

  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(`invoices/${order._id}.pdf`));

  doc.fontSize(20).text("All India Boards Invoice");

  doc.text(`Order ID: ${order._id}`);

  doc.text(`Total: ₹${order.totalPrice}`);

  doc.end();
}

module.exports = generateInvoice;