require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const ensureAdmin = require("./utils/ensureAdmin");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be set and at least 32 characters long");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1); // required behind Render/Heroku-style proxies for rate limiting + secure cookies
app.use(helmet({ contentSecurityPolicy: { useDefaults: true, directives: { "upgrade-insecure-requests": null } } }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

const limiter = (limit, opts = {}) => rateLimit({ windowMs: 15 * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, message: { message: "Too many requests, please try again later" }, ...opts });
app.use("/api", limiter(600));
app.use("/api/auth", limiter(30));
for (const p of ["/api/items", "/api/claims", "/api/images"]) app.use(p, limiter(60, { skip: (req) => req.method === "GET" }));

app.get("/api/health", (req, res) => res.json({ success: true, message: "Smart Lost & Found API is running" }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/items", require("./routes/items"));
app.use("/api/claims", require("./routes/claims"));
app.use("/api/images", require("./routes/images"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api", (req, res) => res.status(404).json({ message: "API route not found" }));

// Serve the built React app (production)
const dist = path.join(__dirname, "../client/dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.use((err, req, res, next) => {
  if (err.status !== 413) console.error(err.message);
  res.status(err.status || 500).json({ message: err.status ? err.message : "Internal server error" });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(ensureAdmin)
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((err) => { console.error("Server startup failed:", err.message); process.exit(1); });
