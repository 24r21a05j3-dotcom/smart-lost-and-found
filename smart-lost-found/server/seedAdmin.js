// Run once: npm run seed:admin  (uses ADMIN_EMAIL / ADMIN_PASSWORD from .env)
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
(async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) { console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ chars) in .env"); process.exit(1); }
  await mongoose.connect(MONGODB_URI);
  const email = ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) { existing.role = "admin"; await existing.save(); console.log("Existing user promoted to admin"); }
  else { await User.create({ name: "Administrator", email, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), role: "admin" }); console.log("Admin created"); }
  await mongoose.disconnect();
})();
