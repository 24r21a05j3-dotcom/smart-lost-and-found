const express = require("express");
const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const router = express.Router();

router.post("/", auth, async (req, res, next) => {
  try {
    const { itemId, proof } = req.body;
    if (typeof itemId !== "string" || !mongoose.isValidObjectId(itemId) || typeof proof !== "string" ||
        proof.trim().length < 10 || proof.trim().length > 2000)
      return res.status(400).json({ message: "Provide a valid item ID and ownership evidence (10+ characters)" });
    const item = await Item.findById(itemId);
    if (!item || item.status !== "open") return res.status(404).json({ message: "Item is not available for claims" });
    if (item.owner.toString() === req.user.id) return res.status(400).json({ message: "You cannot claim your own report" });
    if (await Claim.findOne({ item: itemId, claimant: req.user.id, status: "pending" }))
      return res.status(409).json({ message: "You already have a pending claim" });
    const claim = await Claim.create({ item: itemId, claimant: req.user.id, proof: proof.trim() });
    res.status(201).json({ message: "Claim submitted for review", claimId: claim._id, status: claim.status });
  } catch (err) { next(err); }
});

router.get("/mine", auth, async (req, res, next) => {
  try {
    res.json(await Claim.find({ claimant: req.user.id }).select("-proof").populate("item", "title type status").sort({ createdAt: -1 }));
  } catch (err) { next(err); }
});

router.get("/", auth, admin, async (req, res, next) => {
  try {
    const filter = ["pending", "approved", "rejected"].includes(req.query.status) ? { status: req.query.status } : {};
    res.json(await Claim.find(filter).populate("item", "title type status").populate("claimant", "name email").sort({ createdAt: -1 }).limit(100));
  } catch (err) { next(err); }
});

router.patch("/:id/review", auth, admin, async (req, res, next) => {
  try {
    const { decision, reason } = req.body;
    if (!mongoose.isValidObjectId(req.params.id) || !["approved", "rejected"].includes(decision) ||
        typeof reason !== "string" || reason.trim().length < 3 || reason.length > 1000)
      return res.status(400).json({ message: "Provide a decision (approved/rejected) and a reason" });
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    if (claim.status !== "pending") return res.status(409).json({ message: "This claim was already reviewed" });
    const item = await Item.findById(claim.item);
    if (!item) return res.status(404).json({ message: "Item no longer exists" });
    if (decision === "approved") {
      if (item.status !== "open") return res.status(409).json({ message: "Item is no longer open for claims" });
      item.status = "pending_return";
      await item.save();
      await Claim.updateMany({ item: item._id, _id: { $ne: claim._id }, status: "pending" },
        { status: "rejected", reviewedBy: req.user.id, reviewReason: "Another claim was approved for this item" });
    }
    claim.status = decision;
    claim.reviewedBy = req.user.id;
    claim.reviewReason = reason.trim();
    await claim.save();
    res.json({ message: `Claim ${decision}`, claim });
  } catch (err) { next(err); }
});

module.exports = router;
