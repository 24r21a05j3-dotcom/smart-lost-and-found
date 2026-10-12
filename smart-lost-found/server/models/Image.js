const mongoose = require("mongoose");
module.exports = mongoose.model("Image", new mongoose.Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, enum: ["image/jpeg", "image/png", "image/webp"], required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true }));
