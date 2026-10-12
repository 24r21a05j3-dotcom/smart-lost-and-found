const test = require("node:test");
const assert = require("node:assert");
const { scoreMatch } = require("../utils/matching");

const base = { title: "Black backpack", description: "Black bag with blue keychain", category: "Bags", location: "Library", date: "2026-10-12" };

test("strong match scores high", () => {
  const s = scoreMatch({ ...base, type: "lost" }, { ...base, type: "found", date: "2026-10-13" });
  assert.ok(s >= 90, `score was ${s}`);
});
test("unrelated items score low", () => {
  const s = scoreMatch({ ...base, type: "lost" }, { type: "found", title: "Phone charger", description: "White cable", category: "Electronics", location: "Hostel", date: "2026-09-01" });
  assert.ok(s < 20, `score was ${s}`);
});
test("two lost reports never match", () => {
  assert.strictEqual(scoreMatch({ ...base, type: "lost" }, { ...base, type: "lost" }), 0);
});
test("score is capped at 100", () => {
  assert.ok(scoreMatch({ ...base, type: "lost" }, { ...base, type: "found" }) <= 100);
});
