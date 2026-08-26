import "server-only";

import { cloneTaxSeason } from "../tax-season-domain";
import {
  getActiveTaxSeason,
  getTaxSeasons,
} from "../tax-seasons";
import type { TaxSeasonConfigurationProvider } from "./tax-season-configuration-provider";

/** Wraps the approved synchronous registry in the future async contract. */
export const codeTaxSeasonConfigurationProvider: TaxSeasonConfigurationProvider = {
  async listSeasons() {
    return getTaxSeasons().map(cloneTaxSeason);
  },

  async getSeasonByCode(code) {
    const normalizedCode = code.trim();
    const season = getTaxSeasons().find(
      (candidate) => candidate.id === normalizedCode,
    );

    return season ? cloneTaxSeason(season) : null;
  },

  async getCurrentSeason() {
    return cloneTaxSeason(getActiveTaxSeason());
  },
};
