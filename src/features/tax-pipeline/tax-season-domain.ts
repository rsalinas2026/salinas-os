/** Pure operational Tax Season domain types and helpers. */

export type TaxSeasonStatus = "planned" | "active" | "archived";

export type TaxSeasonProject = {
  id: string;
  name: string;
  asanaProjectGid: string;
  enabled: boolean;
};

export type TaxSeason = {
  id: string;
  year: number;
  name: string;
  status: TaxSeasonStatus;
  projects: TaxSeasonProject[];
};

/** Returns a detached copy while preserving configured project order. */
export function cloneTaxSeason(season: TaxSeason): TaxSeason {
  return {
    ...season,
    projects: season.projects.map((project) => ({ ...project })),
  };
}

/** Returns seasons newest first without mutating the provided collection. */
export function orderTaxSeasonsNewestFirst(
  seasons: readonly TaxSeason[],
): TaxSeason[] {
  return [...seasons].sort((left, right) => right.year - left.year);
}

/**
 * Returns enabled projects in their configured deterministic order.
 *
 * The code-backed registry uses array position as project priority. A future
 * provider must supply projects in canonical priority order before this pure
 * helper is called.
 */
export function getEnabledSeasonProjects(
  season: TaxSeason,
): TaxSeasonProject[] {
  const enabledProjects = season.projects.filter((project) => project.enabled);

  if (enabledProjects.length === 0) {
    throw new Error(
      `Tax season ${season.id} does not have any enabled Asana projects`,
    );
  }

  const projectsWithoutGids = enabledProjects.filter(
    (project) => !project.asanaProjectGid.trim(),
  );

  if (projectsWithoutGids.length > 0) {
    throw new Error(
      `Tax season ${season.id} has enabled projects without Asana project GIDs. Check the server environment configuration for: ${projectsWithoutGids
        .map((project) => project.name)
        .join(", ")}`,
    );
  }

  return enabledProjects;
}
