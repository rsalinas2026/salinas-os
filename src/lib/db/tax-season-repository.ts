import "server-only";

import { asc, desc, eq, inArray } from "drizzle-orm";
import { getDatabase } from "./client";
import {
  taxSeason,
  taxSeasonProject,
  type PersistentTaxSeasonStatus,
} from "./schema";

export type PersistentTaxSeasonProjectConfiguration = {
  id: string;
  asanaProjectGid: string;
  asanaProjectName: string;
  enabled: boolean;
  priority: number;
  validatedAt: Date;
};

export type PersistentTaxSeasonConfiguration = {
  id: string;
  code: string;
  year: number;
  name: string;
  status: PersistentTaxSeasonStatus;
  isDefault: boolean;
  projects: PersistentTaxSeasonProjectConfiguration[];
};

type SeasonFilter =
  | { column: typeof taxSeason.code; value: string }
  | { column: typeof taxSeason.id; value: string }
  | { column: typeof taxSeason.status; value: PersistentTaxSeasonStatus }
  | { column: typeof taxSeason.isDefault; value: boolean };

async function loadPersistentTaxSeasons(
  filter?: SeasonFilter,
): Promise<PersistentTaxSeasonConfiguration[]> {
  const database = getDatabase();
  const seasonQuery = database
    .select()
    .from(taxSeason)
    .orderBy(desc(taxSeason.year), asc(taxSeason.code));
  const seasons = filter
    ? await seasonQuery.where(eq(filter.column, filter.value))
    : await seasonQuery;

  if (seasons.length === 0) {
    return [];
  }

  const projects = await database
    .select()
    .from(taxSeasonProject)
    .where(
      inArray(
        taxSeasonProject.taxSeasonId,
        seasons.map((season) => season.id),
      ),
    )
    .orderBy(
      asc(taxSeasonProject.priority),
      asc(taxSeasonProject.asanaProjectGid),
    );

  return seasons.map((season) => ({
    id: season.id,
    code: season.code,
    year: season.year,
    name: season.name,
    status: season.status,
    isDefault: season.isDefault,
    projects: projects
      .filter((project) => project.taxSeasonId === season.id)
      .map((project) => ({
        id: project.id,
        asanaProjectGid: project.asanaProjectGid,
        asanaProjectName: project.asanaProjectName,
        enabled: project.enabled,
        priority: project.priority,
        validatedAt: project.validatedAt,
      })),
  }));
}

/** Lists persistent Tax Seasons newest first with canonically ordered projects. */
export function listPersistentTaxSeasons() {
  return loadPersistentTaxSeasons();
}

export async function getPersistentTaxSeasonByCode(code: string) {
  const [season] = await loadPersistentTaxSeasons({
    column: taxSeason.code,
    value: code.trim(),
  });

  return season ?? null;
}

export async function getPersistentTaxSeasonById(id: string) {
  const [season] = await loadPersistentTaxSeasons({
    column: taxSeason.id,
    value: id.trim(),
  });

  return season ?? null;
}

export async function getDefaultPersistentTaxSeason() {
  const [season] = await loadPersistentTaxSeasons({
    column: taxSeason.isDefault,
    value: true,
  });

  return season ?? null;
}

export async function getActivePersistentTaxSeason() {
  const [season] = await loadPersistentTaxSeasons({
    column: taxSeason.status,
    value: "active",
  });

  return season ?? null;
}

/** Uses the explicit default, falling back to the unique active season. */
export async function getCurrentPersistentTaxSeason() {
  return (
    (await getDefaultPersistentTaxSeason()) ??
    (await getActivePersistentTaxSeason())
  );
}

export function getEnabledPersistentSeasonProjects(
  season: PersistentTaxSeasonConfiguration,
) {
  return season.projects.filter((project) => project.enabled);
}
