const express = require("express");
const mongoose = require("mongoose");
const Image = require("../models/Image");
const auth = require("../middleware/auth");
const router = express.Router();

// Check the real file signature, not the browser-supplied type.
function sniff(b) {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return "image/png";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

router.post("/", auth, express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "2mb" }), async (req, res, next) => {
  try {
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ message: "Upload a JPEG, PNG or WebP image (max 2 MB)" });
    const contentType = sniff(req.body);
    if (!contentType) return res.status(400).json({ message: "File is not a valid JPEG, PNG or WebP image" });
    const img = await Image.create({ data: req.body, contentType, owner: req.user.id });
    res.status(201).json({ url: `/api/images/${img._id}` });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end();
    const img = await Image.findById(req.params.id);
    if (!img) return res.status(404).end();
    res.set({ "Content-Type": img.contentType, "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" });
    res.send(img.data);
  } catch (err) { next(err); }
});

module.exports = router;
