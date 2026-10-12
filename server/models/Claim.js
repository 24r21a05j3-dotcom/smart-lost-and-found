const mongoose = require("mongoose");
const claimSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  proof: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewReason: { type: String, default: "", maxlength: 1000 }
}, { timestamps: true });
claimSchema.index({ item: 1, claimant: 1 });
module.exports = mongoose.model("Claim", claimSchema);
