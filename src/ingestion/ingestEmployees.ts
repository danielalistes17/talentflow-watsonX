import axios from "axios";
import dotenv from "dotenv";
import prisma from "../utils/prisma";
import { getEmbedding } from "../agents/client";

dotenv.config();

const SELF = `http://localhost:${process.env.PORT || 3000}`;
const W3_PROFILE_URL = process.env.W3_PROFILE_API_URL || SELF;
const W3_CV_URL = process.env.W3_CV_API_URL || SELF;

function buildEmployeeTextForEmbedding(profile: any, cv: any): string {
  const parts: string[] = [];

  if (cv?.overview) parts.push(cv.overview);

  if (cv?.key_skills) {
    for (const [category, skills] of Object.entries(cv.key_skills)) {
      if (Array.isArray(skills) && skills.length > 0) {
        parts.push(`${category}: ${skills.join(", ")}`);
      }
    }
  }

  if (profile?.expertise_roles) {
    for (const role of profile.expertise_roles) {
      parts.push(`${role.role_title}: ${role.specialties?.join(", ") || ""}`);
    }
  }

  if (cv?.ibm_assignments) {
    for (const assignment of cv.ibm_assignments) {
      parts.push(`${assignment.role_title} at ${assignment.client_name}: ${assignment.description || ""}`);
    }
  }

  if (cv?.industry_experience) {
    parts.push("Industries: " + cv.industry_experience.map((ie: any) => `${ie.industry} (${ie.proficiency})`).join(", "));
  }

  if (profile?.credentials) {
    parts.push("Credentials: " + profile.credentials.map((c: any) => c.name).join(", "));
  }

  return parts.join("\n");
}

export async function ingestAllEmployees(): Promise<{ ingested: number; errors: string[] }> {
  const errors: string[] = [];
  let ingested = 0;

  const { data: employees } = await axios.get(`${W3_PROFILE_URL}/w3/employees`);

  for (const profile of employees) {
    try {
      const { data: fullProfile } = await axios.get(`${W3_PROFILE_URL}/w3/employees/${profile.serial}`);

      let cv: any = null;
      try {
        const { data } = await axios.get(`${W3_CV_URL}/w3/cv/${profile.serial}`);
        cv = data;
      } catch {
        // CV may not exist for all employees
      }

      const embeddingText = buildEmployeeTextForEmbedding(fullProfile, cv);
      let embedding: number[] | null = null;
      try {
        embedding = await getEmbedding(embeddingText);
      } catch {
        errors.push(`Failed to get embedding for ${profile.serial}`);
      }

      await prisma.employee.upsert({
        where: { serial: profile.serial },
        update: {
          name: profile.name,
          email: profile.email,
          slack_handle: profile.slack_handle,
          phone_mobile: profile.phone_mobile,
          phone_office: profile.phone_office,
          preferred_contact: profile.preferred_contact,
          primary_language: profile.primary_language,
          work_location_code: profile.work_location_code,
          campus_id: profile.campus_id,
          address_street: profile.address_street,
          address_city: profile.address_city,
          address_country: profile.address_country,
          address_building: profile.address_building,
          address_floor: profile.address_floor,
          on_bench: profile.on_bench,
          availability_date: profile.availability_date ? new Date(profile.availability_date) : null,
          business_unit: profile.business_unit,
          practice: profile.practice,
          department_name: profile.department_name,
          department_code: profile.department_code,
          org_code: profile.org_code,
          division_code: profile.division_code,
          cost_center: profile.cost_center,
          organization_hierarchy: profile.organization_hierarchy,
          people_manager_serial: profile.people_manager_serial,
          country_manager_serial: profile.country_manager_serial,
          peers_count: profile.peers_count,
          cv_overview: cv?.overview || null,
          cv_key_skills: cv?.key_skills || null,
          cv_language: cv?.cv_language || null,
          cv_updated_at: cv?.cv_updated_at ? new Date(cv.cv_updated_at) : null,
        },
        create: {
          serial: profile.serial,
          name: profile.name,
          email: profile.email,
          slack_handle: profile.slack_handle,
          phone_mobile: profile.phone_mobile,
          phone_office: profile.phone_office,
          preferred_contact: profile.preferred_contact,
          primary_language: profile.primary_language,
          work_location_code: profile.work_location_code,
          campus_id: profile.campus_id,
          address_street: profile.address_street,
          address_city: profile.address_city,
          address_country: profile.address_country,
          address_building: profile.address_building,
          address_floor: profile.address_floor,
          on_bench: profile.on_bench,
          availability_date: profile.availability_date ? new Date(profile.availability_date) : null,
          business_unit: profile.business_unit,
          practice: profile.practice,
          department_name: profile.department_name,
          department_code: profile.department_code,
          org_code: profile.org_code,
          division_code: profile.division_code,
          cost_center: profile.cost_center,
          organization_hierarchy: profile.organization_hierarchy,
          people_manager_serial: profile.people_manager_serial,
          country_manager_serial: profile.country_manager_serial,
          peers_count: profile.peers_count,
          cv_overview: cv?.overview || null,
          cv_key_skills: cv?.key_skills || null,
          cv_language: cv?.cv_language || null,
          cv_updated_at: cv?.cv_updated_at ? new Date(cv.cv_updated_at) : null,
        },
      });

      if (embedding) {
        const vectorStr = `[${embedding.join(",")}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE employees SET skill_embedding = $1::vector WHERE serial = $2`,
          vectorStr,
          profile.serial
        );
      }

      // Upsert credentials
      if (fullProfile.credentials) {
        await prisma.employeeCredential.deleteMany({ where: { employee_serial: profile.serial } });
        for (const cred of fullProfile.credentials) {
          await prisma.employeeCredential.create({
            data: {
              employee_serial: profile.serial,
              name: cred.name,
              issuer: cred.issuer,
              level: cred.level,
              type: cred.type,
            },
          });
        }
      }

      // Upsert roles
      if (fullProfile.expertise_roles) {
        await prisma.employeeRole.deleteMany({ where: { employee_serial: profile.serial } });
        for (const role of fullProfile.expertise_roles) {
          await prisma.employeeRole.create({
            data: {
              employee_serial: profile.serial,
              role_title: role.role_title,
              role_description: role.role_description,
              specialties: role.specialties || [],
            },
          });
        }
      }

      // Upsert CV child records
      if (cv) {
        if (cv.ibm_assignments) {
          await prisma.cvIbmAssignment.deleteMany({ where: { employee_serial: profile.serial } });
          for (const a of cv.ibm_assignments) {
            await prisma.cvIbmAssignment.create({
              data: {
                employee_serial: profile.serial,
                role_title: a.role_title,
                client_name: a.client_name,
                location: a.location,
                date_from: a.date_from ? new Date(a.date_from) : null,
                date_to: a.date_to ? new Date(a.date_to) : null,
                description: a.description,
                contribution: a.contribution || [],
              },
            });
          }
        }

        if (cv.work_experience) {
          await prisma.cvWorkExperience.deleteMany({ where: { employee_serial: profile.serial } });
          for (const w of cv.work_experience) {
            await prisma.cvWorkExperience.create({
              data: {
                employee_serial: profile.serial,
                role_title: w.role_title,
                company_name: w.company_name,
                location: w.location,
                date_from: w.date_from ? new Date(w.date_from) : null,
                date_to: w.date_to ? new Date(w.date_to) : null,
                description: w.description,
              },
            });
          }
        }

        if (cv.languages) {
          await prisma.cvLanguage.deleteMany({ where: { employee_serial: profile.serial } });
          for (const l of cv.languages) {
            await prisma.cvLanguage.create({
              data: {
                employee_serial: profile.serial,
                language: l.language,
                spoken_proficiency: l.spoken_proficiency,
                written_proficiency: l.written_proficiency,
              },
            });
          }
        }

        if (cv.education) {
          await prisma.cvEducation.deleteMany({ where: { employee_serial: profile.serial } });
          for (const e of cv.education) {
            await prisma.cvEducation.create({
              data: {
                employee_serial: profile.serial,
                degree_title: e.degree_title,
                institution: e.institution,
                country: e.country,
                graduation_year: e.graduation_year,
                specialization: e.specialization,
              },
            });
          }
        }

        if (cv.industry_experience) {
          await prisma.cvIndustryExperience.deleteMany({ where: { employee_serial: profile.serial } });
          for (const ie of cv.industry_experience) {
            await prisma.cvIndustryExperience.create({
              data: {
                employee_serial: profile.serial,
                industry: ie.industry,
                proficiency: ie.proficiency,
              },
            });
          }
        }
      }

      ingested++;
      console.log(`Ingested employee ${profile.serial} (${profile.name})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${profile.serial}: ${message}`);
      console.error(`Error ingesting ${profile.serial}:`, message);
    }
  }

  return { ingested, errors };
}

if (require.main === module) {
  ingestAllEmployees()
    .then((result) => {
      console.log(`\nIngestion complete: ${result.ingested} employees ingested`);
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
