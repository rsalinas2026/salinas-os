import "server-only";

import { selectOperationalTaxSeasonProvider } from "./operational-tax-season-provider-selection";

export function listOperationalTaxSeasons() {
  return selectOperationalTaxSeasonProvider().listSeasons();
}

export function getOperationalTaxSeasonByCode(code: string) {
  return selectOperationalTaxSeasonProvider().getSeasonByCode(code);
}

export function getCurrentOperationalTaxSeason() {
  return selectOperationalTaxSeasonProvider().getCurrentSeason();
}

/** Resolves an explicit season code or the current configured season. */
export async function resolveOperationalTaxSeason(
  code?: string | null,
) {
  if (!code?.trim()) {
    return getCurrentOperationalTaxSeason();
  }

  const normalizedCode = code.trim();
  const season = await getOperationalTaxSeasonByCode(normalizedCode);

  if (!season) {
    throw new Error(`Unknown tax season: ${normalizedCode}`);
  }

  return season;
}
