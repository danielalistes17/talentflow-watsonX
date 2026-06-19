import express from "express";
import { employees } from "./data/employees";

const app = express();
const PORT = 4001;

app.use(express.json());

app.get("/w3/employees", (_req, res) => {
  const summary = employees.map(({ credentials, expertise_roles, ...rest }) => rest);
  res.json(summary);
});

app.get("/w3/employees/bench", (_req, res) => {
  const bench = employees.filter((e) => e.on_bench);
  res.json(bench);
});

app.get("/w3/employees/:serial", (req, res) => {
  const emp = employees.find((e) => e.serial === req.params.serial);
  if (!emp) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json(emp);
});

app.listen(PORT, () => {
  console.log(`Mock W3 Profile API running on http://localhost:${PORT}`);
});

export default app;
