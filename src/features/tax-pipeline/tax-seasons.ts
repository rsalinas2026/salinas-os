/**
 * Salinas OS — Tax Season Management
 *
 * This module is the single source of truth for tax seasons and their
 * connected Asana projects.
 *
 * Important architecture:
 * - Asana remains the workflow engine.
 * - Salinas OS remains the intelligence layer.
 * - A tax season may contain one or more Asana projects.
 * - Application features should depend on a TaxSeason, not directly on
 *   ASANA_PROJECT_GID.
 */

import {
  getEnabledSeasonProjects,
  orderTaxSeasonsNewestFirst,
  type TaxSeason,
  type TaxSeasonProject,
} from "./tax-season-domain";

export {
  getEnabledSeasonProjects,
  type TaxSeason,
  type TaxSeasonProject,
  type TaxSeasonStatus,
} from "./tax-season-domain";

/**
 * Reads the legacy project GID from the environment.
 *
 * We keep this compatibility layer so the existing 2026 system continues
 * working while the rest of Salinas OS becomes season-aware.
 */
function getLegacyAsanaProjectGid(): string {
  return process.env.ASANA_PROJECT_GID?.trim() ?? "";
}

/**
 * Tax season registry.
 *
 * Add future tax seasons here.
 *
 * Example for 2027:
 *
 * {
 *   id: "2027",
 *   year: 2027,
 *   name: "2027 Tax Season",
 *   status: "planned",
 *   projects: [
 *     {
 *       id: "2027-primary",
 *       name: "2027 TAX SEASON",
 *       asanaProjectGid: process.env.ASANA_2027_PROJECT_GID ?? "",
 *       enabled: true,
 *     },
 *   ],
 * }
 */
const TAX_SEASONS: TaxSeason[] = [
  {
    id: "2026",
    year: 2026,
    name: "2026 Tax Season",
    status: "active",
    projects: [
      {
        id: "2026-primary",
        name: "2026 TAX SEASON",
        asanaProjectGid: getLegacyAsanaProjectGid(),
        enabled: true,
      },
    ],
  },
];

/**
 * Returns every configured tax season, ordered newest first.
 *
 * A cloned array is returned so callers cannot modify the registry itself.
 */
export function getTaxSeasons(): TaxSeason[] {
  return orderTaxSeasonsNewestFirst(TAX_SEASONS);
}

/**
 * Returns a season using its stable internal ID.
 */
export function getTaxSeasonById(seasonId: string): TaxSeason {
  const normalizedSeasonId = seasonId.trim();

  const season = TAX_SEASONS.find(
    (candidate) => candidate.id === normalizedSeasonId,
  );

  if (!season) {
    throw new Error(`Unknown tax season: ${normalizedSeasonId}`);
  }

  return season;
}

/**
 * Returns a season using its calendar year.
 */
export function getTaxSeasonByYear(year: number): TaxSeason {
  const season = TAX_SEASONS.find((candidate) => candidate.year === year);

  if (!season) {
    throw new Error(`No tax season is configured for year ${year}`);
  }

  return season;
}

/**
 * Returns the currently active tax season.
 *
 * Salinas OS allows exactly one active season at a time.
 */
export function getActiveTaxSeason(): TaxSeason {
  const activeSeasons = TAX_SEASONS.filter(
    (season) => season.status === "active",
  );

  if (activeSeasons.length === 0) {
    throw new Error("No active tax season is configured");
  }

  if (activeSeasons.length > 1) {
    throw new Error(
      `Multiple active tax seasons are configured: ${activeSeasons
        .map((season) => season.id)
        .join(", ")}`,
    );
  }

  return activeSeasons[0];
}

/**
 * Resolves either a requested season or the active season.
 *
 * This will be useful for future API routes such as:
 *
 * /api/asana?season=2026
 * /api/asana?season=2027
 */
export function resolveTaxSeason(seasonId?: string | null): TaxSeason {
  if (!seasonId?.trim()) {
    return getActiveTaxSeason();
  }

  return getTaxSeasonById(seasonId);
}

/**
 * Returns the enabled Asana project GIDs for a tax season.
 */
export function getSeasonProjectGids(season: TaxSeason): string[] {
  return getEnabledSeasonProjects(season).map(
    (project) => project.asanaProjectGid,
  );
}

/**
 * Returns the primary Asana project for a season.
 *
 * This is mainly a backward-compatibility helper for routes that still
 * expect one project. Multi-project routes should use
 * getEnabledSeasonProjects() or getSeasonProjectGids().
 */
export function getPrimarySeasonProject(
  season: TaxSeason,
): TaxSeasonProject {
  const [primaryProject] = getEnabledSeasonProjects(season);

  return primaryProject;
}

/**
 * Returns the active season's primary project GID.
 *
 * This temporarily replaces direct reads of ASANA_PROJECT_GID while we
 * upgrade the existing services and routes.
 */
export function getActiveSeasonPrimaryProjectGid(): string {
  return getPrimarySeasonProject(getActiveTaxSeason()).asanaProjectGid;
}
