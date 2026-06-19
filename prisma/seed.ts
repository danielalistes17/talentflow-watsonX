import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { employees } from "../mocks/data/employees";
import { cvs } from "../mocks/data/cvs";
import { seats } from "../mocks/data/seats";

import dotenv from "dotenv";
dotenv.config();

import pg from "pg";

const connectionString = (process.env.DATABASE_URL || "").replace(/\?.*$/, "");
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

function buildEmployeeEmbeddingText(emp: (typeof employees)[0], cv?: (typeof cvs)[0]): string {
  const parts: string[] = [];
  if (cv?.overview) parts.push(cv.overview);
  if (cv?.key_skills) {
    for (const [cat, skills] of Object.entries(cv.key_skills)) {
      if (skills.length > 0) parts.push(`${cat}: ${skills.join(", ")}`);
    }
  }
  for (const role of emp.expertise_roles) {
    parts.push(`${role.role_title}: ${role.specialties.join(", ")}`);
  }
  if (cv?.ibm_assignments) {
    for (const a of cv.ibm_assignments) {
      parts.push(`${a.role_title} at ${a.client_name}: ${a.description}`);
    }
  }
  if (cv?.industry_experience) {
    parts.push("Industries: " + cv.industry_experience.map((ie) => `${ie.industry} (${ie.proficiency})`).join(", "));
  }
  parts.push("Credentials: " + emp.credentials.map((c) => c.name).join(", "));
  return parts.join("\n");
}

function buildSeatEmbeddingText(seat: (typeof seats)[0]): string {
  const parts: string[] = [];
  if (seat.title) parts.push(seat.title);
  if (seat.project_description) parts.push(seat.project_description);
  if (seat.required_skills) {
    const parsed = seat.required_skills.split(/\n/).map((l) => l.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
    parts.push("Required skills: " + parsed.join(", "));
  }
  if (seat.nice_to_have_skills) parts.push("Nice to have: " + seat.nice_to_have_skills);
  if (seat.industry) parts.push("Industry: " + seat.industry);
  if (seat.service_area) parts.push("Service area: " + seat.service_area);
  return parts.join("\n");
}

async function main() {
  console.log("Seeding database...\n");

  // Hash passwords for demo users
  const benchPassword = await bcrypt.hash("bench123", 10);
  const publisherPassword = await bcrypt.hash("publisher123", 10);

  // Seed employees
  for (const emp of employees) {
    const cv = cvs.find((c) => c.serial === emp.serial);
    const embeddingText = buildEmployeeEmbeddingText(emp, cv);
    const embedding = deterministicEmbedding(embeddingText);
    const vectorStr = `[${embedding.join(",")}]`;

    // Assign demo passwords: IBM001 = bench user, IBM010 = publisher
    let passwordHash: string | null = null;
    if (emp.serial === "IBM001") passwordHash = benchPassword;
    if (emp.serial === "IBM010") passwordHash = publisherPassword;

    await prisma.employee.upsert({
      where: { serial: emp.serial },
      update: {},
      create: {
        serial: emp.serial,
        name: emp.name,
        email: emp.email,
        slack_handle: emp.slack_handle,
        phone_mobile: emp.phone_mobile,
        phone_office: emp.phone_office,
        preferred_contact: emp.preferred_contact,
        primary_language: emp.primary_language,
        work_location_code: emp.work_location_code,
        campus_id: emp.campus_id,
        address_street: emp.address_street,
        address_city: emp.address_city,
        address_country: emp.address_country,
        address_building: emp.address_building,
        address_floor: emp.address_floor,
        on_bench: emp.on_bench,
        availability_date: emp.availability_date ? new Date(emp.availability_date) : null,
        business_unit: emp.business_unit,
        practice: emp.practice,
        department_name: emp.department_name,
        department_code: emp.department_code,
        org_code: emp.org_code,
        division_code: emp.division_code,
        cost_center: emp.cost_center,
        organization_hierarchy: emp.organization_hierarchy,
        people_manager_serial: emp.people_manager_serial,
        country_manager_serial: emp.country_manager_serial,
        peers_count: emp.peers_count,
        cv_overview: cv?.overview || null,
        cv_key_skills: cv?.key_skills ?? undefined,
        cv_language: cv?.cv_language || null,
        cv_updated_at: cv?.cv_updated_at ? new Date(cv.cv_updated_at) : null,
        password_hash: passwordHash,
      },
    });

    // Set embedding via raw SQL
    await prisma.$executeRawUnsafe(
      `UPDATE employees SET skill_embedding = $1::vector WHERE serial = $2`,
      vectorStr,
      emp.serial
    );

    // Seed credentials
    for (const cred of emp.credentials) {
      await prisma.employeeCredential.create({
        data: {
          employee_serial: emp.serial,
          name: cred.name,
          issuer: cred.issuer,
          level: cred.level,
          type: cred.type,
        },
      });
    }

    // Seed roles
    for (const role of emp.expertise_roles) {
      await prisma.employeeRole.create({
        data: {
          employee_serial: emp.serial,
          role_title: role.role_title,
          role_description: role.role_description,
          specialties: role.specialties,
        },
      });
    }

    // Seed CV child records if CV exists
    if (cv) {
      for (const a of cv.ibm_assignments) {
        await prisma.cvIbmAssignment.create({
          data: {
            employee_serial: emp.serial,
            role_title: a.role_title,
            client_name: a.client_name,
            location: a.location,
            date_from: new Date(a.date_from),
            date_to: a.date_to ? new Date(a.date_to) : null,
            description: a.description,
            contribution: a.contribution,
          },
        });
      }

      for (const w of cv.work_experience) {
        await prisma.cvWorkExperience.create({
          data: {
            employee_serial: emp.serial,
            role_title: w.role_title,
            company_name: w.company_name,
            location: w.location,
            date_from: new Date(w.date_from),
            date_to: new Date(w.date_to),
            description: w.description,
          },
        });
      }

      for (const l of cv.languages) {
        await prisma.cvLanguage.create({
          data: {
            employee_serial: emp.serial,
            language: l.language,
            spoken_proficiency: l.spoken_proficiency,
            written_proficiency: l.written_proficiency,
          },
        });
      }

      for (const e of cv.education) {
        await prisma.cvEducation.create({
          data: {
            employee_serial: emp.serial,
            degree_title: e.degree_title,
            institution: e.institution,
            country: e.country,
            graduation_year: e.graduation_year,
            specialization: e.specialization,
          },
        });
      }

      for (const ie of cv.industry_experience) {
        await prisma.cvIndustryExperience.create({
          data: {
            employee_serial: emp.serial,
            industry: ie.industry,
            proficiency: ie.proficiency,
          },
        });
      }
    }

    console.log(`  Seeded employee: ${emp.serial} (${emp.name})${passwordHash ? " [demo login]" : ""}`);
  }

  // Seed seats/projects
  for (const seat of seats) {
    const embeddingText = buildSeatEmbeddingText(seat);
    const embedding = deterministicEmbedding(embeddingText);
    const vectorStr = `[${embedding.join(",")}]`;

    const parsedSkills = seat.required_skills
      .split(/\n/)
      .map((l) => l.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);

    await prisma.project.upsert({
      where: { seat_id: seat.seat_id },
      update: {},
      create: {
        seat_id: seat.seat_id,
        title: seat.title,
        status: seat.status,
        candidate_tracking_status: seat.candidate_tracking_status,
        fulfillment_risk: seat.fulfillment_risk,
        professionals_in_play: seat.professionals_in_play,
        positions_required: seat.positions_required,
        positions_filled: seat.positions_filled,
        start_date: new Date(seat.start_date),
        end_date: new Date(seat.end_date),
        client_name: seat.client_name,
        client_confidential: seat.client_confidential,
        project_name: seat.project_name,
        project_type: seat.project_type,
        project_description: seat.project_description,
        industry: seat.industry,
        sector: seat.sector,
        contract_type: seat.contract_type,
        contract_owner: seat.contract_owner,
        service_line: seat.service_line,
        service: seat.service,
        service_area: seat.service_area,
        required_skills: seat.required_skills,
        nice_to_have_skills: seat.nice_to_have_skills,
        required_skills_parsed: parsedSkills,
        requested_band_low: seat.requested_band_low,
        requested_band_high: seat.requested_band_high,
        requested_languages: seat.requested_languages,
        remote_working: seat.remote_working,
        needed_on_site: seat.needed_on_site,
        work_location_country: seat.work_location_country,
        work_location_city: seat.work_location_city,
        work_location_market: seat.work_location_market,
        work_location_geo: seat.work_location_geo,
        hours_per_week: seat.hours_per_week,
        citizenship_or_residency_required: seat.citizenship_or_residency_required,
        pay_travel_and_lodging: seat.pay_travel_and_lodging,
        primary_location_overlapping_hours: seat.primary_location_overlapping_hours,
        min_overlapping_hours: seat.min_overlapping_hours,
        security_clearance: seat.security_clearance,
        gic_provider_country: seat.gic_provider_country,
        gic_delivery_organization: seat.gic_delivery_organization,
        global_delivery_center: seat.global_delivery_center,
        cloned_from: seat.cloned_from,
        owner_serial: seat.owner_serial,
        project_contact_serial: seat.project_contact_serial,
        gic_fulfillment_manager_serial: seat.gic_fulfillment_manager_serial,
        gic_project_manager_serial: seat.gic_project_manager_serial,
        additional_comments: seat.additional_comments,
        created_at: new Date(seat.created_at),
        submitted_at: new Date(seat.submitted_at),
        last_modified_at: new Date(seat.last_modified_at),
        last_modified_by: seat.last_modified_by,
      },
    });

    await prisma.$executeRawUnsafe(
      `UPDATE projects SET skill_embedding = $1::vector WHERE seat_id = $2`,
      vectorStr,
      seat.seat_id
    );

    console.log(`  Seeded seat: ${seat.seat_id} (${seat.title})`);
  }

  console.log("\nSeed complete!");
  console.log("\nDemo login credentials:");
  console.log("  Bench employee: marko.horvat@ibm.com / bench123");
  console.log("  Seat publisher: tomislav.matic@ibm.com / publisher123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
