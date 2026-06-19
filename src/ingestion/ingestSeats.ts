import axios from "axios";
import dotenv from "dotenv";
import prisma from "../utils/prisma";
import { getEmbedding, extractSkills } from "../agents/client";

dotenv.config();

const PROM_URL = process.env.PROM_SEATS_API_URL || "http://localhost:4003";

function buildSeatTextForEmbedding(seat: any, parsedSkills: string[]): string {
  const parts: string[] = [];

  if (seat.title) parts.push(seat.title);
  if (seat.project_description) parts.push(seat.project_description);
  if (parsedSkills.length > 0) parts.push("Required skills: " + parsedSkills.join(", "));
  if (seat.nice_to_have_skills) parts.push("Nice to have: " + seat.nice_to_have_skills);
  if (seat.industry) parts.push("Industry: " + seat.industry);
  if (seat.service_area) parts.push("Service area: " + seat.service_area);

  return parts.join("\n");
}

export async function ingestAllSeats(): Promise<{ ingested: number; errors: string[] }> {
  const errors: string[] = [];
  let ingested = 0;

  const { data: allSeats } = await axios.get(`${PROM_URL}/prom/seats?status=open`);
  const { data: closedSeats } = await axios.get(`${PROM_URL}/prom/seats?status=closed`);
  const seats = [...allSeats, ...closedSeats];

  for (const seat of seats) {
    try {
      let parsedSkills: string[] = [];
      if (seat.required_skills) {
        try {
          parsedSkills = await extractSkills(seat.required_skills);
        } catch {
          parsedSkills = seat.required_skills
            .split(/\n/)
            .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
            .filter((line: string) => line.length > 0);
          errors.push(`Failed to extract skills via agent for seat ${seat.seat_id}, used fallback parser`);
        }
      }

      const embeddingText = buildSeatTextForEmbedding(seat, parsedSkills);
      let embedding: number[] | null = null;
      try {
        embedding = await getEmbedding(embeddingText);
      } catch {
        errors.push(`Failed to get embedding for seat ${seat.seat_id}`);
      }

      await prisma.project.upsert({
        where: { seat_id: seat.seat_id },
        update: {
          title: seat.title,
          status: seat.status,
          candidate_tracking_status: seat.candidate_tracking_status,
          fulfillment_risk: seat.fulfillment_risk,
          professionals_in_play: seat.professionals_in_play,
          positions_required: seat.positions_required,
          positions_filled: seat.positions_filled,
          start_date: seat.start_date ? new Date(seat.start_date) : null,
          end_date: seat.end_date ? new Date(seat.end_date) : null,
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
          submitted_at: seat.submitted_at ? new Date(seat.submitted_at) : null,
          last_modified_at: seat.last_modified_at ? new Date(seat.last_modified_at) : null,
          last_modified_by: seat.last_modified_by,
        },
        create: {
          seat_id: seat.seat_id,
          title: seat.title,
          status: seat.status,
          candidate_tracking_status: seat.candidate_tracking_status,
          fulfillment_risk: seat.fulfillment_risk,
          professionals_in_play: seat.professionals_in_play,
          positions_required: seat.positions_required,
          positions_filled: seat.positions_filled,
          start_date: seat.start_date ? new Date(seat.start_date) : null,
          end_date: seat.end_date ? new Date(seat.end_date) : null,
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
          submitted_at: seat.submitted_at ? new Date(seat.submitted_at) : null,
          last_modified_at: seat.last_modified_at ? new Date(seat.last_modified_at) : null,
          last_modified_by: seat.last_modified_by,
          created_at: seat.created_at ? new Date(seat.created_at) : new Date(),
        },
      });

      if (embedding) {
        const vectorStr = `[${embedding.join(",")}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE projects SET skill_embedding = $1::vector WHERE seat_id = $2`,
          vectorStr,
          seat.seat_id
        );
      }

      ingested++;
      console.log(`Ingested seat ${seat.seat_id} (${seat.title})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${seat.seat_id}: ${message}`);
      console.error(`Error ingesting seat ${seat.seat_id}:`, message);
    }
  }

  return { ingested, errors };
}

if (require.main === module) {
  ingestAllSeats()
    .then((result) => {
      console.log(`\nIngestion complete: ${result.ingested} seats ingested`);
      if (result.errors.length > 0) {
        console.log(`Errors: ${result.errors.join("\n")}`);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error("Ingestion failed:", err);
      process.exit(1);
    });
}
