const express = require("express");
const mongoose = require("mongoose");
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const User = require("../models/User");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const router = express.Router();
router.use(auth, admin);

router.get("/stats", async (req, res, next) => {
  try {
    const [lost, found, open, resolved, pendingClaims] = await Promise.all([
      Item.countDocuments({ type: "lost" }), Item.countDocuments({ type: "found" }),
      Item.countDocuments({ status: "open" }), Item.countDocuments({ status: "resolved" }),
      Claim.countDocuments({ status: "pending" })
    ]);
    res.json({ lost, found, total: lost + found, open, resolved, pendingClaims });
  } catch (err) { next(err); }
});

router.get("/items", async (req, res, next) => {
  try { res.json(await Item.find().sort({ createdAt: -1 }).limit(100).populate("owner", "name email")); } catch (err) { next(err); }
});

router.get("/users", async (req, res, next) => {
  try { res.json(await User.find().select("name email role disabled createdAt").sort({ createdAt: -1 }).limit(200)); } catch (err) { next(err); }
});

router.patch("/users/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || typeof req.body.disabled !== "boolean") return res.status(400).json({ message: "Invalid request" });
    if (req.params.id === req.user.id) return res.status(400).json({ message: "You cannot disable your own account" });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.role === "admin") return res.status(400).json({ message: "Administrator accounts cannot be disabled here" });
    target.disabled = req.body.disabled;
    await target.save();
    res.json({ id: target.id, disabled: target.disabled });
  } catch (err) { next(err); }
});

module.exports = router;
