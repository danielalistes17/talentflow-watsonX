import express from "express";
import crypto from "crypto";

const app = express();
const PORT = 4004;

app.use(express.json());

function deterministicEmbedding(text: string): number[] {
  const hash = crypto.createHash("sha256").update(text).digest();
  const embedding: number[] = [];
  for (let i = 0; i < 1536; i++) {
    const byteIndex = i % hash.length;
    const bitOffset = i % 8;
    const base = ((hash[byteIndex]! >> bitOffset) & 1) === 1 ? 0.5 : -0.5;
    const variation = (hash[(i * 7 + 3) % hash.length]! / 255) * 0.5 - 0.25;
    embedding.push(base + variation);
  }
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  return embedding.map((v) => v / magnitude);
}

app.post("/embed", (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text field is required" });
    return;
  }
  const embedding = deterministicEmbedding(text);
  res.json({ embedding });
});

app.post("/extract-skills", (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text field is required" });
    return;
  }
  const skills = text
    .split(/\n/)
    .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line: string) => line.length > 0 && line.length < 100);
  res.json({ skills });
});

app.post("/explain", (req, res) => {
  const { employee_skills, employee_assignments, seat_title, similarity_score } = req.body;

  const matchedSkills = (employee_skills || []).slice(0, 3).join(", ");
  const assignment = (employee_assignments || [])[0] || "previous engagements";
  const scorePercent = Math.round((similarity_score || 0) * 100);

  const explanation = `Strong match (${scorePercent}% skill similarity) on ${matchedSkills}. Your experience from ${assignment} is directly relevant to ${seat_title || "this role"}. The combination of technical skills and domain experience makes this a compelling fit for the engagement.`;

  res.json({ explanation });
});

app.post("/classify-proforma", (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text field is required" });
    return;
  }

  const lower = text.toLowerCase();
  const namesCandidate =
    lower.includes("notes id") ||
    lower.includes("pmp:") ||
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b.*\b(band|rolling off|agreed|informally)\b/i.test(text);

  const hasInternalLocationDetails =
    lower.includes("gdc") ||
    lower.includes("delivery center") ||
    lower.includes("delivery centre") ||
    (lower.includes("shift") && lower.includes("hours"));

  res.json({ names_candidate: namesCandidate, has_internal_location_details: hasInternalLocationDetails });
});

app.listen(PORT, () => {
  console.log(`Mock Agent Server running on http://localhost:${PORT}`);
});

export default app;
