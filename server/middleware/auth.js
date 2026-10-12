const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Reads the HTTP-only cookie (or a Bearer header, handy for Postman) and
// loads the CURRENT role from the database, so disabled users lose access at once.
module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization;
  const token = req.cookies?.token || (header?.startsWith("Bearer ") ? header.slice(7) : null);
  if (!token) return res.status(401).json({ message: "Please log in first" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("role disabled");
    if (!user || user.disabled) return res.status(401).json({ message: "Account unavailable" });
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired login" });
  }
};
