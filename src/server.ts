import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth";
import apiRoutes from "./routes/api";
import internalRoutes from "./routes/internal";

import { employees } from "../mocks/data/employees";
import { cvs } from "../mocks/data/cvs";
import { seats } from "../mocks/data/seats";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Mock W3 Profile API routes ---
app.get("/w3/employees", (_req, res) => {
  const summary = employees.map(({ credentials, expertise_roles, ...rest }) => rest);
  res.json(summary);
});

app.get("/w3/employees/bench", (_req, res) => {
  res.json(employees.filter((e) => e.on_bench));
});

app.get("/w3/employees/:serial", (req, res) => {
  const emp = employees.find((e) => e.serial === req.params.serial);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  res.json(emp);
});

// --- Mock W3 CV API routes ---
app.get("/w3/cv/:serial", (req, res) => {
  const cv = cvs.find((c) => c.serial === req.params.serial);
  if (!cv) { res.status(404).json({ error: "CV not found" }); return; }
  res.json(cv);
});

// --- Mock ProM Seats API routes ---
app.get("/prom/seats", (req, res) => {
  const statusFilter = (req.query.status as string) || "open";
  res.json(seats.filter((s) => s.status === statusFilter));
});

app.get("/prom/seats/new", (_req, res) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  res.json(seats.filter((s) => new Date(s.created_at) >= oneDayAgo));
});

app.get("/prom/seats/:seat_id", (req, res) => {
  const seat = seats.find((s) => s.seat_id === req.params.seat_id);
  if (!seat) { res.status(404).json({ error: "Seat not found" }); return; }
  res.json(seat);
});

// --- Mock IBM CA Agent routes ---
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
  if (!text || typeof text !== "string") { res.status(400).json({ error: "text field is required" }); return; }
  res.json({ embedding: deterministicEmbedding(text) });
});

app.post("/extract-skills", (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") { res.status(400).json({ error: "text field is required" }); return; }
  const skills = text.split(/\n/).map((line: string) => line.replace(/^\d+\.\s*/, "").trim()).filter((line: string) => line.length > 0 && line.length < 100);
  res.json({ skills });
});

app.post("/explain", (req, res) => {
  const { employee_skills, employee_assignments, seat_title, similarity_score } = req.body;
  const matchedSkills = (employee_skills || []).slice(0, 3).join(", ");
  const assignment = (employee_assignments || [])[0] || "previous engagements";
  const scorePercent = Math.round((similarity_score || 0) * 100);
  res.json({ explanation: `Strong match (${scorePercent}% skill similarity) on ${matchedSkills}. Your experience from ${assignment} is directly relevant to ${seat_title || "this role"}. The combination of technical skills and domain experience makes this a compelling fit for the engagement.` });
});

app.post("/classify-proforma", (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") { res.status(400).json({ error: "text field is required" }); return; }
  const lower = text.toLowerCase();
  const names_candidate = lower.includes("notes id") || lower.includes("pmp:") || /\b[A-Z][a-z]+ [A-Z][a-z]+\b.*\b(band|rolling off|agreed|informally)\b/i.test(text);
  const has_internal_location_details = lower.includes("gdc") || lower.includes("delivery center") || lower.includes("delivery centre") || (lower.includes("shift") && lower.includes("hours"));
  res.json({ names_candidate, has_internal_location_details });
});

// --- TalentFlow application routes ---
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/internal", internalRoutes);

app.listen(PORT, () => {
  console.log(`TalentFlow API running on http://localhost:${PORT}`);
});

export default app;
