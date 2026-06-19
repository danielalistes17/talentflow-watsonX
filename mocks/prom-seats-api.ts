import express from "express";
import { seats } from "./data/seats";

const app = express();
const PORT = 4003;

app.use(express.json());

app.get("/prom/seats", (req, res) => {
  const statusFilter = (req.query.status as string) || "open";
  const filtered = seats.filter((s) => s.status === statusFilter);
  res.json(filtered);
});

app.get("/prom/seats/new", (_req, res) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = seats.filter((s) => new Date(s.created_at) >= oneDayAgo);
  res.json(recent);
});

app.get("/prom/seats/:seat_id", (req, res) => {
  const seat = seats.find((s) => s.seat_id === req.params.seat_id);
  if (!seat) {
    res.status(404).json({ error: "Seat not found" });
    return;
  }
  res.json(seat);
});

app.listen(PORT, () => {
  console.log(`Mock ProM Seats API running on http://localhost:${PORT}`);
});

export default app;
