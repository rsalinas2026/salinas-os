import "server-only";

import { codeTaxSeasonConfigurationProvider } from "./code-tax-season-configuration-provider";
import type { TaxSeasonConfigurationProvider } from "./tax-season-configuration-provider";

// Code-backed configuration is intentionally the only operational provider
// in this checkpoint. No environment selection or database fallback exists.
const operationalProvider: TaxSeasonConfigurationProvider =
  codeTaxSeasonConfigurationProvider;

export function listOperationalTaxSeasons() {
  return operationalProvider.listSeasons();
}

export function getOperationalTaxSeasonByCode(code: string) {
  return operationalProvider.getSeasonByCode(code);
}

export function getCurrentOperationalTaxSeason() {
  return operationalProvider.getCurrentSeason();
}

/** Resolves an explicit season code or the current code-backed season. */
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
