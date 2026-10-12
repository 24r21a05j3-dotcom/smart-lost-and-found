function normalize(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}
function wordSimilarity(a, b) {
  const A = new Set(normalize(a)), B = new Set(normalize(b));
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const w of A) if (B.has(w)) common++;
  return common / new Set([...A, ...B]).size;
}
function scoreMatch(lost, found) {
  if (lost.type !== "lost" || found.type !== "found") return 0;
  let score = 0;
  if (lost.category === found.category) score += 30;
  score += Math.round(wordSimilarity(`${lost.title} ${lost.description}`, `${found.title} ${found.description}`) * 30);
  if (lost.location.trim().toLowerCase() === found.location.trim().toLowerCase()) score += 25;
  const days = Math.abs(new Date(lost.date) - new Date(found.date)) / 86400000;
  if (days <= 2) score += 15;
  return Math.min(score, 100);
}
module.exports = { scoreMatch };
