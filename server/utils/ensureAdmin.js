const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Creates the first admin on startup if ADMIN_EMAIL/ADMIN_PASSWORD are set and no admin exists.
module.exports = async function ensureAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  if (ADMIN_PASSWORD.length < 8) return console.warn("ADMIN_PASSWORD must be 8+ characters; admin not created");
  if (await User.exists({ role: "admin" })) return;
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) { existing.role = "admin"; await existing.save(); }
  else await User.create({ name: "Administrator", email, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), role: "admin" });
  console.log(`Admin account ready: ${email}`);
};
