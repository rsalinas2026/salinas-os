import "server-only";

import type { TaxSeason } from "../tax-season-domain";

/** Async operational configuration contract implemented by one provider. */
export interface TaxSeasonConfigurationProvider {
  listSeasons(): Promise<TaxSeason[]>;
  getSeasonByCode(code: string): Promise<TaxSeason | null>;
  getCurrentSeason(): Promise<TaxSeason>;
}
