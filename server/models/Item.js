const mongoose = require("mongoose");
const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  type: { type: String, enum: ["lost", "found"], required: true },
  category: { type: String, enum: ["Electronics", "Documents", "Bags", "Clothing", "Accessories", "Other"], required: true },
  location: { type: String, required: true, trim: true, maxlength: 200 },
  date: { type: Date, required: true },
  imageUrl: { type: String, default: "", validate: { validator: (v) => v === "" || /^\/api\/images\/[a-f\d]{24}$/i.test(v), message: "Invalid image" } },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["open", "pending_return", "resolved", "rejected"], default: "open" }
}, { timestamps: true });
module.exports = mongoose.model("Item", itemSchema);
