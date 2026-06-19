import { Router, Request, Response } from "express";
import { ingestAllEmployees } from "../ingestion/ingestEmployees";
import { ingestAllSeats } from "../ingestion/ingestSeats";

const router = Router();

router.post("/ingest/seats", async (_req: Request, res: Response) => {
  try {
    const result = await ingestAllSeats();
    res.json({ message: "Seat ingestion complete", ...result });
  } catch (err) {
    console.error("Seat ingestion error:", err);
    res.status(500).json({ error: "Seat ingestion failed" });
  }
});

router.post("/ingest/employees", async (_req: Request, res: Response) => {
  try {
    const result = await ingestAllEmployees();
    res.json({ message: "Employee ingestion complete", ...result });
  } catch (err) {
    console.error("Employee ingestion error:", err);
    res.status(500).json({ error: "Employee ingestion failed" });
  }
});

export default router;
