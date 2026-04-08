const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI);

async function createAdmin() {
  const hashedPassword = await bcrypt.hash("86468646", 10);

  await Admin.create({
    email: "faisal.dpathshala@gmail.com",
    password: hashedPassword,
    role: "superadmin",
  });

  console.log("✅ Admin created");
  process.exit();
}

createAdmin();