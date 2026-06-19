import prisma from "../utils/prisma";
import { checkTimezoneOverlap } from "../utils/timezones";
import { getEmbedding, getMatchExplanation } from "../agents/client";

export interface MatchResult {
  pass: boolean;
  score: number;
  explanation: string;
  skills_matched: string[];
  skills_missing: string[];
  stop_reason: string | null;
  timezone_warning: string | null;
}

interface EmployeeForMatching {
  serial: string;
  address_country: string | null;
  address_city: string | null;
  availability_date: Date | null;
  cv_key_skills: unknown;
  cv_overview: string | null;
  languages: { language: string; spoken_proficiency: string }[];
  industry_experience: { industry: string; proficiency: string }[];
  ibm_assignments: { client_name: string | null; role_title: string }[];
  roles: { role_title: string }[];
}

interface SeatForMatching {
  seat_id: string;
  title: string;
  status: string;
  candidate_tracking_status: string;
  requested_languages: string[];
  remote_working: boolean;
  needed_on_site: boolean;
  work_location_country: string | null;
  citizenship_or_residency_required: boolean;
  primary_location_overlapping_hours: string | null;
  min_overlapping_hours: number | null;
  start_date: Date | null;
  industry: string | null;
  required_skills: string | null;
  required_skills_parsed: unknown;
  nice_to_have_skills: string | null;
  requested_band_low: string | null;
  requested_band_high: string | null;
}

function stepStatusFilter(seat: SeatForMatching): { pass: boolean; reason: string | null } {
  if (seat.status !== "open") {
    return { pass: false, reason: "Seat is closed" };
  }
  return { pass: true, reason: null };
}

function stepTrackingStatusFilter(seat: SeatForMatching): { pass: boolean; reason: string | null } {
  if (seat.candidate_tracking_status !== "Actively searching") {
    return { pass: false, reason: "Position already has a preferred candidate" };
  }
  return { pass: true, reason: null };
}

function stepLanguageFilter(
  employee: EmployeeForMatching,
  seat: SeatForMatching
): { pass: boolean; reason: string | null; bonus: number } {
  const empLangs = new Map(
    employee.languages.map((l) => [l.language.toLowerCase(), l.spoken_proficiency])
  );

  for (const required of seat.requested_languages) {
    const proficiency = empLangs.get(required.toLowerCase());
    if (!proficiency || !["Fluent", "Professional"].includes(proficiency)) {
      return {
        pass: false,
        reason: `Missing required language: ${required} (Fluent or Professional proficiency needed)`,
        bonus: 0,
      };
    }
  }

  let bonus = 0;
  if (seat.nice_to_have_skills) {
    const niceToHave = seat.nice_to_have_skills.toLowerCase();
    for (const [lang, prof] of empLangs) {
      if (niceToHave.includes(lang) && ["Fluent", "Professional"].includes(prof)) {
        bonus = 5;
        break;
      }
    }
  }

  return { pass: true, reason: null, bonus };
}

function stepLocationFilter(
  employee: EmployeeForMatching,
  seat: SeatForMatching
): { pass: boolean; reason: string | null } {
  if (seat.remote_working && !seat.citizenship_or_residency_required) {
    return { pass: true, reason: null };
  }

  if (seat.citizenship_or_residency_required || seat.needed_on_site) {
    if (employee.address_country !== seat.work_location_country) {
      return {
        pass: false,
        reason: `Location mismatch: employee is in ${employee.address_country}, seat requires ${seat.work_location_country}${seat.citizenship_or_residency_required ? " (citizenship/residency required)" : " (on-site required)"}`,
      };
    }
  }

  return { pass: true, reason: null };
}

function stepTimezoneCheck(
  employee: EmployeeForMatching,
  seat: SeatForMatching
): { warning: string | null; penalty: number } {
  const result = checkTimezoneOverlap(
    employee.address_country,
    employee.address_city,
    seat.primary_location_overlapping_hours,
    seat.min_overlapping_hours
  );
  return { warning: result.warning, penalty: result.penalty };
}

function extractSkillsFromKeySkills(keySkills: unknown): string[] {
  if (!keySkills || typeof keySkills !== "object") return [];
  const skills: string[] = [];
  for (const category of Object.values(keySkills as Record<string, string[]>)) {
    if (Array.isArray(category)) {
      skills.push(...category);
    }
  }
  return skills;
}

function parseSeatSkills(seat: SeatForMatching): string[] {
  if (Array.isArray(seat.required_skills_parsed)) {
    return seat.required_skills_parsed as string[];
  }
  if (seat.required_skills) {
    return seat.required_skills
      .split(/\n/)
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((line) => line.length > 0);
  }
  return [];
}

const BAND_ORDER = ["6A", "6B", "7A", "7B", "8", "9", "10"];

function computeBandScore(seatBandLow: string | null, seatBandHigh: string | null): number {
  if (!seatBandLow) return 50;
  const empBand = "7B";
  const empIdx = BAND_ORDER.indexOf(empBand);
  const lowIdx = BAND_ORDER.indexOf(seatBandLow);
  const highIdx = seatBandHigh ? BAND_ORDER.indexOf(seatBandHigh) : lowIdx;

  if (empIdx === -1 || lowIdx === -1) return 50;

  if (empIdx >= lowIdx && empIdx <= highIdx) return 100;
  if (Math.abs(empIdx - lowIdx) <= 1 || Math.abs(empIdx - highIdx) <= 1) return 50;
  return 0;
}

function computeIndustryScore(
  seatIndustry: string | null,
  employeeIndustries: { industry: string; proficiency: string }[]
): number {
  if (!seatIndustry) return 50;

  const match = employeeIndustries.find(
    (ie) => ie.industry.toLowerCase() === seatIndustry.toLowerCase()
  );

  if (!match) return 0;

  const proficiencyScores: Record<string, number> = {
    Expert: 100,
    Experienced: 80,
    Knowledgeable: 50,
    Basic: 25,
  };

  return proficiencyScores[match.proficiency] ?? 25;
}

function computeProximityScore(seatStartDate: Date | null, employeeAvailDate: Date | null): number {
  if (!seatStartDate) return 50;
  if (!employeeAvailDate) return 50;

  const gapMs = seatStartDate.getTime() - employeeAvailDate.getTime();
  const gapDays = gapMs / (1000 * 60 * 60 * 24);

  if (gapDays <= 0) return 100;
  if (gapDays >= 90) return 0;
  return Math.round(100 * (1 - gapDays / 90));
}

function computeSkillOverlap(
  employeeSkills: string[],
  seatSkills: string[]
): { matched: string[]; missing: string[] } {
  const empLower = new Set(employeeSkills.map((s) => s.toLowerCase()));
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of seatSkills) {
    const skillLower = skill.toLowerCase();
    const found = [...empLower].some(
      (es) => es.includes(skillLower) || skillLower.includes(es)
    );
    if (found) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  return { matched, missing };
}

export async function runMatchingPipeline(
  employee: EmployeeForMatching,
  seat: SeatForMatching
): Promise<MatchResult> {
  const statusResult = stepStatusFilter(seat);
  if (!statusResult.pass) {
    return {
      pass: false, score: 0, explanation: "", skills_matched: [], skills_missing: [],
      stop_reason: statusResult.reason, timezone_warning: null,
    };
  }

  const trackingResult = stepTrackingStatusFilter(seat);
  if (!trackingResult.pass) {
    return {
      pass: false, score: 0, explanation: "", skills_matched: [], skills_missing: [],
      stop_reason: trackingResult.reason, timezone_warning: null,
    };
  }

  const langResult = stepLanguageFilter(employee, seat);
  if (!langResult.pass) {
    return {
      pass: false, score: 0, explanation: "", skills_matched: [], skills_missing: [],
      stop_reason: langResult.reason, timezone_warning: null,
    };
  }

  const locationResult = stepLocationFilter(employee, seat);
  if (!locationResult.pass) {
    return {
      pass: false, score: 0, explanation: "", skills_matched: [], skills_missing: [],
      stop_reason: locationResult.reason, timezone_warning: null,
    };
  }

  const tzResult = stepTimezoneCheck(employee, seat);

  let skillsScore = 50;
  try {
    const result = await prisma.$queryRawUnsafe<{ distance: number }[]>(
      `SELECT (e.skill_embedding <=> p.skill_embedding) as distance
       FROM employees e, projects p
       WHERE e.serial = $1 AND p.seat_id = $2
       AND e.skill_embedding IS NOT NULL AND p.skill_embedding IS NOT NULL`,
      employee.serial,
      seat.seat_id
    );
    if (result.length > 0) {
      skillsScore = Math.round((1 - result[0]!.distance) * 100);
    }
  } catch {
    skillsScore = 50;
  }

  const employeeSkills = extractSkillsFromKeySkills(employee.cv_key_skills);
  const seatSkills = parseSeatSkills(seat);
  const { matched, missing } = computeSkillOverlap(employeeSkills, seatSkills);

  const bandScore = computeBandScore(seat.requested_band_low, seat.requested_band_high);
  const industryScore = computeIndustryScore(seat.industry, employee.industry_experience);
  const proximityScore = computeProximityScore(seat.start_date, employee.availability_date);
  const languageBonus = langResult.bonus;
  const tzScore = 50 + tzResult.penalty * 10;

  const score = Math.round(
    skillsScore * 0.4 +
    bandScore * 0.2 +
    industryScore * 0.2 +
    proximityScore * 0.1 +
    languageBonus * 0.05 * 20 +
    Math.max(0, Math.min(100, tzScore)) * 0.05
  );

  const finalScore = Math.max(0, Math.min(100, score));

  let explanation: string;
  if (finalScore >= 40) {
    try {
      explanation = await getMatchExplanation({
        employee_skills: employeeSkills.slice(0, 10),
        employee_assignments: employee.ibm_assignments.map(
          (a) => `${a.role_title} at ${a.client_name}`
        ),
        seat_required_skills: seatSkills.slice(0, 10),
        seat_title: seat.title,
        similarity_score: skillsScore / 100,
      });
    } catch {
      explanation = `Match score ${finalScore}/100. ${matched.length} skills matched out of ${seatSkills.length} required.`;
    }
  } else {
    explanation = `Low confidence match (${finalScore}/100). Only ${matched.length} of ${seatSkills.length} required skills matched.`;
  }

  return {
    pass: true,
    score: finalScore,
    explanation,
    skills_matched: matched,
    skills_missing: missing,
    stop_reason: null,
    timezone_warning: tzResult.warning,
  };
}
