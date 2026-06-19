import { Router, Request, Response } from "express";
import prisma from "../utils/prisma";
import { requireAuth, requireRole } from "../auth/auth";
import { runMatchingPipeline } from "../matching/pipeline";
import { detectProformaRisk } from "../proforma/detector";
import { getEmbedding } from "../agents/client";

const router = Router();

router.get("/seats/search", requireAuth, async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query || query.trim().length === 0) {
    res.status(400).json({ error: "Query parameter q is required" });
    return;
  }

  try {
    const queryEmbedding = await getEmbedding(query);
    const vectorStr = `[${queryEmbedding.join(",")}]`;

    const results = await prisma.$queryRawUnsafe<
      { seat_id: string; title: string; distance: number }[]
    >(
      `SELECT seat_id, title, (skill_embedding <=> $1::vector) as distance
       FROM projects
       WHERE status = 'open' AND skill_embedding IS NOT NULL
       ORDER BY distance ASC
       LIMIT 20`,
      vectorStr
    );

    const seatIds = results.map((r) => r.seat_id);
    const seats = await prisma.project.findMany({
      where: { seat_id: { in: seatIds } },
      include: { applications: true },
    });

    const employee = await prisma.employee.findUnique({
      where: { serial: req.user!.serial },
      include: {
        languages: true,
        industry_experience: true,
        ibm_assignments: true,
        roles: true,
      },
    });

    const enriched = await Promise.all(
      seats.map(async (seat) => {
        const proforma = await detectProformaRisk(
          { ...seat, created_at: seat.created_at },
          seat.applications.map((a) => ({ applied_at: a.applied_at, status: a.status }))
        );

        let matchResult: Awaited<ReturnType<typeof runMatchingPipeline>> | null = null;
        if (employee) {
          matchResult = await runMatchingPipeline(employee, seat);
        }

        const distance = results.find((r) => r.seat_id === seat.seat_id)?.distance ?? 1;

        return {
          seat_id: seat.seat_id,
          title: seat.title,
          client_name: seat.client_confidential ? "Confidential" : seat.client_name,
          industry: seat.industry,
          work_location_city: seat.work_location_city,
          work_location_country: seat.work_location_country,
          remote_working: seat.remote_working,
          start_date: seat.start_date,
          relevance_score: Math.round((1 - distance) * 100),
          match: matchResult,
          proforma_risk: proforma,
        };
      })
    );

    enriched.sort((a, b) => (b.match?.score ?? b.relevance_score) - (a.match?.score ?? a.relevance_score));

    res.json(enriched);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/seats/matches", requireAuth, async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { serial: req.user!.serial },
      include: {
        languages: true,
        industry_experience: true,
        ibm_assignments: true,
        roles: true,
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const openSeats = await prisma.project.findMany({
      where: { status: "open" },
      include: { applications: true },
    });

    const results = await Promise.all(
      openSeats.map(async (seat) => {
        const matchResult = await runMatchingPipeline(employee, seat);
        const proforma = await detectProformaRisk(
          { ...seat, created_at: seat.created_at },
          seat.applications.map((a) => ({ applied_at: a.applied_at, status: a.status }))
        );

        return {
          seat_id: seat.seat_id,
          title: seat.title,
          client_name: seat.client_confidential ? "Confidential" : seat.client_name,
          industry: seat.industry,
          project_name: seat.project_name,
          work_location_city: seat.work_location_city,
          work_location_country: seat.work_location_country,
          remote_working: seat.remote_working,
          start_date: seat.start_date,
          end_date: seat.end_date,
          positions_required: seat.positions_required,
          positions_filled: seat.positions_filled,
          match: matchResult,
          proforma_risk: proforma,
        };
      })
    );

    const passing = results
      .filter((r) => r.match.pass)
      .sort((a, b) => b.match.score - a.match.score);

    const failing = results
      .filter((r) => !r.match.pass)
      .map((r) => ({
        seat_id: r.seat_id,
        title: r.title,
        reason: r.match.stop_reason,
      }));

    res.json({ matches: passing, filtered_out: failing });
  } catch (err) {
    console.error("Matches error:", err);
    res.status(500).json({ error: "Failed to compute matches" });
  }
});

router.post("/applications", requireAuth, async (req: Request, res: Response) => {
  const { seat_id } = req.body;
  if (!seat_id) {
    res.status(400).json({ error: "seat_id is required" });
    return;
  }

  try {
    const seat = await prisma.project.findUnique({
      where: { seat_id },
      include: { applications: true },
    });

    if (!seat) {
      res.status(404).json({ error: "Seat not found" });
      return;
    }

    const existing = await prisma.application.findUnique({
      where: {
        project_seat_id_employee_serial: {
          project_seat_id: seat_id,
          employee_serial: req.user!.serial,
        },
      },
    });

    if (existing) {
      res.status(409).json({ error: "Already applied to this seat" });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { serial: req.user!.serial },
      include: {
        languages: true,
        industry_experience: true,
        ibm_assignments: true,
        roles: true,
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const matchResult = await runMatchingPipeline(employee, seat);
    const proformaResult = await detectProformaRisk(
      { ...seat, created_at: seat.created_at },
      seat.applications.map((a) => ({ applied_at: a.applied_at, status: a.status }))
    );

    const application = await prisma.application.create({
      data: {
        project_seat_id: seat_id,
        employee_serial: req.user!.serial,
        match_score: matchResult.score,
        match_explanation: matchResult.explanation,
        skills_matched: matchResult.skills_matched,
        skills_missing: matchResult.skills_missing,
        proforma_risk: proformaResult.risk,
        proforma_signals: proformaResult.signals,
      },
    });

    res.status(201).json(application);
  } catch (err) {
    console.error("Application error:", err);
    res.status(500).json({ error: "Failed to create application" });
  }
});

router.get("/applications/mine", requireAuth, async (req: Request, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      where: { employee_serial: req.user!.serial },
      include: {
        project: {
          select: {
            title: true,
            client_name: true,
            client_confidential: true,
            industry: true,
            work_location_city: true,
            start_date: true,
            status: true,
          },
        },
      },
      orderBy: { applied_at: "desc" },
    });

    const result = applications.map((app) => ({
      ...app,
      project: {
        ...app.project,
        client_name: app.project.client_confidential ? "Confidential" : app.project.client_name,
      },
    }));

    res.json(result);
  } catch (err) {
    console.error("My applications error:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

router.get(
  "/seats/:seat_id/candidates",
  requireAuth,
  requireRole("seat_publisher"),
  async (req: Request, res: Response) => {
    try {
      const applications = await prisma.application.findMany({
        where: { project_seat_id: req.params.seat_id as string },
        include: {
          employee: {
            select: {
              serial: true,
              name: true,
              email: true,
              address_city: true,
              address_country: true,
              practice: true,
              business_unit: true,
            },
          },
        },
        orderBy: { match_score: "desc" },
      });

      res.json(applications);
    } catch (err) {
      console.error("Candidates error:", err);
      res.status(500).json({ error: "Failed to fetch candidates" });
    }
  }
);

export default router;
