import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth";
import apiRoutes from "./routes/api";
import internalRoutes from "./routes/internal";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/internal", internalRoutes);

app.listen(PORT, () => {
  console.log(`TalentFlow API running on http://localhost:${PORT}`);
});

export default app;
