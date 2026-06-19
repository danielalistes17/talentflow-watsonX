import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const EMBEDDING_URL = process.env.IBM_CA_EMBEDDING_AGENT_URL || "http://localhost:4004/embed";
const SKILL_EXTRACTION_URL = process.env.IBM_CA_SKILL_EXTRACTION_AGENT_URL || "http://localhost:4004/extract-skills";
const EXPLANATION_URL = process.env.IBM_CA_EXPLANATION_AGENT_URL || "http://localhost:4004/explain";
const PROFORMA_CLASSIFIER_URL = process.env.IBM_CA_PROFORMA_CLASSIFIER_AGENT_URL || "http://localhost:4004/classify-proforma";

export interface EmbeddingResponse {
  embedding: number[];
}

export interface SkillExtractionResponse {
  skills: string[];
}

export interface ExplanationResponse {
  explanation: string;
}

export interface ProformaClassification {
  names_candidate: boolean;
  has_internal_location_details: boolean;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const { data } = await axios.post<EmbeddingResponse>(EMBEDDING_URL, { text });
  if (!Array.isArray(data.embedding) || data.embedding.length !== 1536) {
    throw new Error(`Invalid embedding response: expected 1536-length array, got ${data.embedding?.length}`);
  }
  return data.embedding;
}

export async function extractSkills(text: string): Promise<string[]> {
  const { data } = await axios.post<SkillExtractionResponse>(SKILL_EXTRACTION_URL, { text });
  if (!Array.isArray(data.skills)) {
    throw new Error("Invalid skill extraction response: expected skills array");
  }
  return data.skills;
}

export async function getMatchExplanation(params: {
  employee_skills: string[];
  employee_assignments: string[];
  seat_required_skills: string[];
  seat_title: string;
  similarity_score: number;
}): Promise<string> {
  const { data } = await axios.post<ExplanationResponse>(EXPLANATION_URL, params);
  if (typeof data.explanation !== "string") {
    throw new Error("Invalid explanation response: expected explanation string");
  }
  return data.explanation;
}

export async function classifyProforma(text: string): Promise<ProformaClassification> {
  const { data } = await axios.post<ProformaClassification>(PROFORMA_CLASSIFIER_URL, { text });
  if (typeof data.names_candidate !== "boolean" || typeof data.has_internal_location_details !== "boolean") {
    throw new Error("Invalid proforma classification response");
  }
  return data;
}
