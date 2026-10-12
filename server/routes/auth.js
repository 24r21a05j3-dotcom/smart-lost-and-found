const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

const createToken = (u) => jwt.sign({ role: u.role }, process.env.JWT_SECRET, { subject: u._id.toString(), expiresIn: "2h" });
const setCookie = (res, u) => res.cookie("token", createToken(u), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 2 * 60 * 60 * 1000 });
const safe = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" ||
        name.trim().length < 2 || name.trim().length > 80 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128)
      return res.status(400).json({ message: "Enter valid details and a password of 8–128 characters" });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: "An account with this email already exists" });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) });
    setCookie(res, user);
    res.status(201).json({ user: safe(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "An account with this email already exists" });
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string") return res.status(400).json({ message: "Email and password are required" });
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: "Invalid email or password" });
    if (user.disabled) return res.status(403).json({ message: "This account has been disabled" });
    setCookie(res, user);
    res.json({ user: safe(user) });
  } catch (err) { next(err); }
});

router.post("/logout", (req, res) => { res.clearCookie("token"); res.json({ message: "Logged out" }); });

module.exports = router;
