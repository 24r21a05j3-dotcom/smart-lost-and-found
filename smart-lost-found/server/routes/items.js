const express = require("express");
const mongoose = require("mongoose");
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const auth = require("../middleware/auth");
const { scoreMatch } = require("../utils/matching");
const router = express.Router();

const validId = (id) => mongoose.isValidObjectId(id);
const EDITABLE = ["title", "description", "category", "location", "date"];

router.get("/", async (req, res, next) => {
  try {
    const filter = { status: { $in: ["open", "pending_return"] } };
    if (["lost", "found"].includes(req.query.type)) filter.type = req.query.type;
    if (typeof req.query.category === "string" && req.query.category) filter.category = req.query.category;
    if (typeof req.query.q === "string" && req.query.q.trim()) {
      const esc = req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = ["title", "description", "location"].map((f) => ({ [f]: { $regex: esc, $options: "i" } }));
    }
    const items = await Item.find(filter).select("-__v").sort({ createdAt: -1 }).limit(100).populate("owner", "name");
    res.json(items);
  } catch (err) { next(err); }
});

router.get("/mine", auth, async (req, res, next) => {
  try { res.json(await Item.find({ owner: req.user.id }).sort({ createdAt: -1 })); } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ message: "Report not found" });
    const item = await Item.findById(req.params.id).populate("owner", "name");
    if (!item || item.status === "rejected") return res.status(404).json({ message: "Report not found" });
    res.json(item);
  } catch (err) { next(err); }
});

router.get("/:id/matches", auth, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ message: "Report not found" });
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Report not found" });
    if (item.owner.toString() !== req.user.id && req.user.role !== "admin") return res.status(403).json({ message: "Not allowed" });
    const candidates = await Item.find({ type: item.type === "lost" ? "found" : "lost", status: "open", _id: { $ne: item._id } }).limit(200);
    const matches = candidates
      .map((c) => ({ item: { _id: c._id, title: c.title, location: c.location, date: c.date, category: c.category, type: c.type },
        score: item.type === "lost" ? scoreMatch(item, c) : scoreMatch(c, item) }))
      .filter((m) => m.score >= 40).sort((a, b) => b.score - a.score).slice(0, 5);
    res.json(matches);
  } catch (err) { next(err); }
});

router.post("/", auth, async (req, res, next) => {
  try {
    const { title, description, type, category, location, date, imageUrl } = req.body;
    const item = await Item.create({ title, description, type, category, location, date, imageUrl: imageUrl || "", owner: req.user.id });
    res.status(201).json(item);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: "Please provide valid item details" });
    next(err);
  }
});

router.patch("/:id", auth, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ message: "Report not found" });
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Report not found" });
    const isAdmin = req.user.role === "admin";
    if (item.owner.toString() !== req.user.id && !isAdmin) return res.status(403).json({ message: "Not allowed" });
    for (const f of EDITABLE) if (typeof req.body[f] === "string") item[f] = req.body[f];
    if (isAdmin && ["open", "pending_return", "resolved", "rejected"].includes(req.body.status)) item.status = req.body.status;
    await item.save();
    res.json(item);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: "Please provide valid item details" });
    next(err);
  }
});

router.delete("/:id", auth, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ message: "Report not found" });
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Report not found" });
    if (item.owner.toString() !== req.user.id && req.user.role !== "admin") return res.status(403).json({ message: "Not allowed" });
    if (await Claim.exists({ item: item._id, status: "approved" })) return res.status(409).json({ message: "Items with an approved claim cannot be deleted" });
    await Claim.deleteMany({ item: item._id });
    await item.deleteOne();
    res.json({ message: "Report deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
