import express from "express";
import { cvs } from "./data/cvs";

const app = express();
const PORT = 4002;

app.use(express.json());

app.get("/w3/cv/:serial", (req, res) => {
  const cv = cvs.find((c) => c.serial === req.params.serial);
  if (!cv) {
    res.status(404).json({ error: "CV not found" });
    return;
  }
  res.json(cv);
});

app.listen(PORT, () => {
  console.log(`Mock W3 CV API running on http://localhost:${PORT}`);
});

export default app;
