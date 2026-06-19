import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const SQL = `
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS cv_industry_experience CASCADE;
DROP TABLE IF EXISTS cv_education CASCADE;
DROP TABLE IF EXISTS cv_languages CASCADE;
DROP TABLE IF EXISTS cv_work_experience CASCADE;
DROP TABLE IF EXISTS cv_ibm_assignments CASCADE;
DROP TABLE IF EXISTS employee_roles CASCADE;
DROP TABLE IF EXISTS employee_credentials CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Drop existing enum types
DROP TYPE IF EXISTS "ApplicationStatus" CASCADE;
DROP TYPE IF EXISTS "ProformaRisk" CASCADE;

-- Create enum types
CREATE TYPE "ApplicationStatus" AS ENUM ('applied', 'shortlisted', 'selected', 'rejected');
CREATE TYPE "ProformaRisk" AS ENUM ('none', 'low', 'medium', 'high');

-- Employees table
CREATE TABLE employees (
  serial TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  slack_handle TEXT,
  phone_mobile TEXT,
  phone_office TEXT,
  preferred_contact TEXT,
  primary_language TEXT NOT NULL DEFAULT 'English',
  work_location_code TEXT,
  campus_id TEXT,
  address_street TEXT,
  address_city TEXT,
  address_country TEXT,
  address_building TEXT,
  address_floor TEXT,
  on_bench BOOLEAN NOT NULL DEFAULT false,
  availability_date TIMESTAMP(3),
  business_unit TEXT,
  practice TEXT,
  department_name TEXT,
  department_code TEXT,
  org_code TEXT,
  division_code TEXT,
  cost_center TEXT,
  organization_hierarchy TEXT,
  people_manager_serial TEXT,
  country_manager_serial TEXT,
  peers_count INTEGER NOT NULL DEFAULT 0,
  cv_overview TEXT,
  cv_key_skills JSONB,
  cv_language TEXT,
  cv_updated_at TIMESTAMP(3),
  skill_embedding vector(1536),
  password_hash TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Employee credentials
CREATE TABLE employee_credentials (
  id SERIAL PRIMARY KEY,
  employee_serial TEXT NOT NULL REFERENCES employees(serial) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,
  level TEXT,
  type TEXT
);

-- Employee roles
CREATE TABLE employee_roles (
  id SERIAL PRIMARY KEY,
  employee_serial TEXT NOT NULL REFERENCES employees(serial) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  role_description TEXT,
  specialties TEXT[] DEFAULT '{}'
);

-- CV IBM assignments
CREATE TABLE cv_ibm_assignments (
  id SERIAL PRIMARY KEY,
  employee_serial TEXT NOT NULL REFERENCES employees(serial) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  client_name TEXT,
  location TEXT,
  date_from TIMESTAMP(3),
  date_to TIMESTAMP(3),
  description TEXT,
  contribution TEXT[] DEFAULT '{}'
);

-- CV work experience
CREATE TABLE cv_work_experience (
  id SERIAL PRIMARY KEY,
  employee_serial TEXT NOT NULL REFERENCES employees(serial) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  company_name TEXT,
  location TEXT,
  date_from TIMESTAMP(3),
  date_to TIMESTAMP(3),
  description TEXT
);

-- CV languages
CREATE TABLE cv_languages (
  id SERIAL PRIMARY KEY,
  employee_serial TEXT NOT NULL REFERENCES employees(serial) ON DELETE CASCADE,
  language TEXT NOT NULL,
  spoken_proficiency TEXT NOT NULL,
  written_proficiency TEXT
);

-- CV education
CREATE TABLE cv_education (
  id SERIAL PRIMARY KEY,
  employee_serial TEXT NOT NULL REFERENCES employees(serial) ON DELETE CASCADE,
  degree_title TEXT NOT NULL,
  institution TEXT,
  country TEXT,
  graduation_year INTEGER,
  specialization TEXT
);

-- CV industry experience
CREATE TABLE cv_industry_experience (
  id SERIAL PRIMARY KEY,
  employee_serial TEXT NOT NULL REFERENCES employees(serial) ON DELETE CASCADE,
  industry TEXT NOT NULL,
  proficiency TEXT NOT NULL
);

-- Projects (seats)
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  seat_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  candidate_tracking_status TEXT NOT NULL DEFAULT 'Actively searching',
  fulfillment_risk TEXT,
  professionals_in_play INTEGER NOT NULL DEFAULT 0,
  positions_required INTEGER NOT NULL DEFAULT 1,
  positions_filled INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP(3),
  end_date TIMESTAMP(3),
  client_name TEXT,
  client_confidential BOOLEAN NOT NULL DEFAULT false,
  project_name TEXT,
  project_type TEXT,
  project_description TEXT,
  industry TEXT,
  sector TEXT,
  contract_type TEXT,
  contract_owner TEXT,
  service_line TEXT,
  service TEXT,
  service_area TEXT,
  required_skills TEXT,
  nice_to_have_skills TEXT,
  required_skills_parsed JSONB,
  requested_band_low TEXT,
  requested_band_high TEXT,
  requested_languages TEXT[] DEFAULT '{}',
  remote_working BOOLEAN NOT NULL DEFAULT false,
  needed_on_site BOOLEAN NOT NULL DEFAULT false,
  work_location_country TEXT,
  work_location_city TEXT,
  work_location_market TEXT,
  work_location_geo TEXT,
  hours_per_week DOUBLE PRECISION,
  citizenship_or_residency_required BOOLEAN NOT NULL DEFAULT false,
  pay_travel_and_lodging BOOLEAN NOT NULL DEFAULT false,
  primary_location_overlapping_hours TEXT,
  min_overlapping_hours DOUBLE PRECISION,
  security_clearance TEXT,
  gic_provider_country TEXT,
  gic_delivery_organization TEXT,
  global_delivery_center TEXT,
  cloned_from TEXT,
  owner_serial TEXT,
  project_contact_serial TEXT,
  gic_fulfillment_manager_serial TEXT,
  gic_project_manager_serial TEXT,
  additional_comments TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP(3),
  last_modified_at TIMESTAMP(3),
  last_modified_by TEXT,
  skill_embedding vector(1536)
);

-- Applications
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  project_seat_id TEXT NOT NULL REFERENCES projects(seat_id) ON DELETE CASCADE,
  employee_serial TEXT NOT NULL REFERENCES employees(serial) ON DELETE CASCADE,
  status "ApplicationStatus" NOT NULL DEFAULT 'applied',
  match_score DOUBLE PRECISION,
  match_explanation TEXT,
  skills_matched TEXT[] DEFAULT '{}',
  skills_missing TEXT[] DEFAULT '{}',
  proforma_risk "ProformaRisk" NOT NULL DEFAULT 'none',
  proforma_signals TEXT[] DEFAULT '{}',
  applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_seat_id, employee_serial)
);

-- Create IVFFlat indexes for cosine similarity search
CREATE INDEX IF NOT EXISTS idx_employees_skill_embedding ON employees USING ivfflat (skill_embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX IF NOT EXISTS idx_projects_skill_embedding ON projects USING ivfflat (skill_embedding vector_cosine_ops) WITH (lists = 10);
`;

async function main() {
  const connectionString = (process.env.DATABASE_URL || "").replace(/\?.*$/, "");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to Supabase database");

    // Split and execute statements individually (some may fail for IVFFlat without data)
    const statements = SQL.split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await client.query(stmt);
        const firstLine = stmt.split("\n").find((l) => l.trim().length > 0) || stmt.substring(0, 60);
        console.log(`  OK: ${firstLine.trim().substring(0, 80)}`);
      } catch (err: any) {
        // IVFFlat index creation will fail if table is empty — that's OK, we'll create after seeding
        if (err.message?.includes("ivfflat")) {
          console.log(`  SKIP (will create after seeding): ${stmt.substring(0, 60).trim()}`);
        } else {
          console.error(`  ERROR: ${err.message} — ${stmt.substring(0, 60).trim()}`);
        }
      }
    }

    console.log("\nDatabase schema created successfully!");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
