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
