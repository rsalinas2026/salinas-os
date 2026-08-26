import "server-only";

import { validateDatabaseUrl } from "@/lib/db/database-url";
import { codeTaxSeasonConfigurationProvider } from "./code-tax-season-configuration-provider";
import { postgresTaxSeasonConfigurationProvider } from "./postgres-tax-season-configuration-provider";
import type { TaxSeasonConfigurationProvider } from "./tax-season-configuration-provider";

export type OperationalTaxSeasonProviderName = "code" | "database";

type ProviderSelectionEnvironment = {
  SALINAS_TAX_SEASON_PROVIDER?: string;
  SALINAS_ENABLE_PRODUCTION_DATABASE_TAX_SEASONS?: string;
  DATABASE_URL?: string;
  NODE_ENV?: string;
};

export class OperationalTaxSeasonProviderSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperationalTaxSeasonProviderSelectionError";
  }
}

export function getOperationalTaxSeasonProviderName(
  environment: ProviderSelectionEnvironment = process.env,
): OperationalTaxSeasonProviderName {
  const configuredValue = environment.SALINAS_TAX_SEASON_PROVIDER?.trim();

  if (!configuredValue || configuredValue === "code") {
    return "code";
  }

  if (configuredValue !== "database") {
    throw new OperationalTaxSeasonProviderSelectionError(
      "SALINAS_TAX_SEASON_PROVIDER must be either code or database.",
    );
  }

  if (
    environment.NODE_ENV === "production" &&
    environment.SALINAS_ENABLE_PRODUCTION_DATABASE_TAX_SEASONS !== "true"
  ) {
    throw new OperationalTaxSeasonProviderSelectionError(
      "Database-backed operational Tax Seasons are not enabled for production.",
    );
  }

  validateDatabaseUrl(environment.DATABASE_URL);

  return "database";
}

export function selectOperationalTaxSeasonProvider(
  environment: ProviderSelectionEnvironment = process.env,
): TaxSeasonConfigurationProvider {
  return getOperationalTaxSeasonProviderName(environment) === "database"
    ? postgresTaxSeasonConfigurationProvider
    : codeTaxSeasonConfigurationProvider;
}
