const LOCATION_UTC_OFFSETS: Record<string, number> = {
  // Croatia
  HR: 1,
  K8W: 1,
  Zagreb: 1,
  // India
  IN: 5.5,
  Bangalore: 5.5,
  Hyderabad: 5.5,
  Mumbai: 5.5,
  Delhi: 5.5,
  Pune: 5.5,
  // US East
  "US-East": -5,
  "New York": -5,
  Atlanta: -5,
  Raleigh: -5,
  // US Central
  "US-Central": -6,
  Dallas: -6,
  Chicago: -6,
  Austin: -6,
  // US West
  "US-West": -8,
  "San Francisco": -8,
  "San Jose": -8,
  Seattle: -8,
  // UK
  GB: 0,
  London: 0,
  // Germany
  DE: 1,
  Berlin: 1,
  Frankfurt: 1,
  // France
  FR: 1,
  Paris: 1,
  // Spain
  ES: 1,
  Madrid: 1,
  Barcelona: 1,
  // Japan
  JP: 9,
  Tokyo: 9,
  // Australia
  AU: 10,
  Sydney: 10,
  Melbourne: 10,
  // Brazil
  BR: -3,
  "São Paulo": -3,
  // China
  CN: 8,
  Shanghai: 8,
  Beijing: 8,
  // Philippines
  PH: 8,
  Manila: 8,
  // Poland
  PL: 1,
  // Romania
  RO: 2,
  Bucharest: 2,
  // Singapore
  SG: 8,
  Singapore: 8,
  // South Korea
  KR: 9,
  Seoul: 9,
  // Argentina
  AR: -3,
  "Buenos Aires": -3,
  // Costa Rica
  CR: -6,
  // Mexico
  MX: -6,
  // Colombia
  CO: -5,
  Bogota: -5,
  // Canada
  CA: -5,
  Toronto: -5,
  // Ireland
  IE: 0,
  Dublin: 0,
  // Netherlands
  NL: 1,
  Amsterdam: 1,
  // Czech Republic
  CZ: 1,
  Prague: 1,
  // Slovakia
  SK: 1,
  Bratislava: 1,
  // Hungary
  HU: 1,
};

const REGION_UTC_OFFSETS: Record<string, number> = {
  "EMEA": 1,
  "Americas": -5,
  "APAC": 8,
  "ASEAN": 8,
  "Europe": 1,
  "Not applicable": 0,
};

export function getUtcOffset(locationKey: string): number | null {
  return LOCATION_UTC_OFFSETS[locationKey] ?? REGION_UTC_OFFSETS[locationKey] ?? null;
}

export function checkTimezoneOverlap(
  employeeCountry: string | null,
  employeeCity: string | null,
  seatOverlapRegion: string | null | undefined,
  minOverlapHours: number | null | undefined
): { compatible: boolean; warning: string | null; penalty: number } {
  if (!seatOverlapRegion || seatOverlapRegion === "Not applicable" || !minOverlapHours) {
    return { compatible: true, warning: null, penalty: 0 };
  }

  const empOffset = getUtcOffset(employeeCountry ?? "") ?? getUtcOffset(employeeCity ?? "");
  const seatOffset = getUtcOffset(seatOverlapRegion);

  if (empOffset === null || seatOffset === null) {
    return { compatible: true, warning: "Could not determine timezone overlap — manual check recommended", penalty: -2 };
  }

  const diff = Math.abs(empOffset - seatOffset);
  const standardWorkday = 8;
  const overlap = Math.max(0, standardWorkday - diff);

  if (overlap >= minOverlapHours) {
    return { compatible: true, warning: null, penalty: 0 };
  }

  return {
    compatible: false,
    warning: `Only ${overlap}h overlap with ${seatOverlapRegion} (need ${minOverlapHours}h). Employee UTC${empOffset >= 0 ? "+" : ""}${empOffset}, seat region UTC${seatOffset >= 0 ? "+" : ""}${seatOffset}`,
    penalty: -5,
  };
}
