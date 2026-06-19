import { classifyProforma } from "../agents/client";

export interface ProformaResult {
  risk: "none" | "low" | "medium" | "high";
  signals: string[];
}

interface SeatForProforma {
  seat_id: string;
  status: string;
  candidate_tracking_status: string;
  professionals_in_play: number;
  positions_required: number;
  positions_filled: number;
  cloned_from: string | null;
  owner_serial: string | null;
  client_name: string | null;
  start_date: Date | null;
  additional_comments: string | null;
  last_modified_by: string | null;
  created_at: Date;
}

interface ApplicationForProforma {
  applied_at: Date;
  status: string;
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export async function detectProformaRisk(
  seat: SeatForProforma,
  applications: ApplicationForProforma[]
): Promise<ProformaResult> {
  const signals: string[] = [];
  let highRisk = false;
  let mediumRisk = false;
  let lowRisk = false;

  // --- HIGH risk checks ---

  if (seat.candidate_tracking_status === "Roll-off being pursued") {
    signals.push(`Tracking status: "${seat.candidate_tracking_status}" indicates a preferred candidate`);
    highRisk = true;
  }

  const ratio = seat.positions_required > 0
    ? seat.professionals_in_play / seat.positions_required
    : 0;

  if (ratio > 10) {
    signals.push(`${seat.professionals_in_play} candidates in play for ${seat.positions_required} position(s) (ratio ${ratio.toFixed(1)})`);
    highRisk = true;
  }

  if (seat.positions_filled === seat.positions_required && seat.status === "open") {
    signals.push(`All ${seat.positions_required} position(s) filled but seat remains open`);
    highRisk = true;
  }

  const oldestApplication = applications
    .filter((a) => a.status !== "rejected")
    .sort((a, b) => a.applied_at.getTime() - b.applied_at.getTime())[0];

  if (oldestApplication) {
    const daysOld = daysSince(oldestApplication.applied_at);
    if (daysOld > 60) {
      signals.push(`Oldest proposed application is ${daysOld} days old with no status change`);
      highRisk = true;
    } else if (daysOld >= 45) {
      signals.push(`Oldest proposed application is ${daysOld} days old (45-60 day warning)`);
      mediumRisk = true;
    } else if (daysOld >= 30) {
      signals.push(`Oldest proposed application is ${daysOld} days old (30-45 day warning)`);
      lowRisk = true;
    }
  }

  // --- MEDIUM risk checks ---

  if (ratio > 5 && ratio <= 10) {
    signals.push(`${seat.professionals_in_play} candidates in play for ${seat.positions_required} position(s) (ratio ${ratio.toFixed(1)})`);
    mediumRisk = true;
  }

  if (seat.cloned_from && seat.owner_serial) {
    signals.push(`Cloned from seat ${seat.cloned_from} with same owner`);
    mediumRisk = true;
  }

  if (seat.last_modified_by && /support/i.test(seat.last_modified_by)) {
    signals.push(`Last modified by "${seat.last_modified_by}" (administrative edit)`);
    mediumRisk = true;
  }

  // --- LOW risk checks ---

  if (seat.cloned_from && !mediumRisk) {
    signals.push(`Cloned from seat ${seat.cloned_from}`);
    lowRisk = true;
  }

  if (seat.start_date && seat.start_date.getTime() < Date.now() && seat.status === "open") {
    signals.push(`Start date ${seat.start_date.toISOString().slice(0, 10)} is in the past but seat is still open`);
    lowRisk = true;
  }

  if (ratio >= 2 && ratio <= 5) {
    signals.push(`${seat.professionals_in_play} candidates in play for ${seat.positions_required} position(s) (ratio ${ratio.toFixed(1)})`);
    lowRisk = true;
  }

  // --- Agent-based classification for additional_comments ---

  if (seat.additional_comments && seat.additional_comments.length > 100) {
    try {
      const classification = await classifyProforma(seat.additional_comments);
      if (classification.names_candidate) {
        signals.push("Additional comments appear to name a specific candidate (pro forma indicator)");
        highRisk = true;
      }
      if (classification.has_internal_location_details) {
        signals.push("Additional comments contain internal delivery location details");
        mediumRisk = true;
      }
    } catch {
      signals.push("Could not classify additional comments — agent unavailable");
    }
  }

  // --- Green (none) check ---

  if (
    !highRisk &&
    !mediumRisk &&
    !lowRisk &&
    seat.professionals_in_play === 0 &&
    seat.cloned_from === null &&
    seat.candidate_tracking_status === "Actively searching" &&
    daysSince(seat.created_at) <= 14
  ) {
    return { risk: "none", signals: [] };
  }

  if (highRisk) return { risk: "high", signals };
  if (mediumRisk) return { risk: "medium", signals };
  if (lowRisk) return { risk: "low", signals };
  return { risk: "none", signals };
}
