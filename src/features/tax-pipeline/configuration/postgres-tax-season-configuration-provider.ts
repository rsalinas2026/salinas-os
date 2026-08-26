import "server-only";

import {
  listPersistentTaxSeasons,
  type PersistentTaxSeasonConfiguration,
} from "@/lib/db/tax-season-repository";
import type {
  TaxSeason,
  TaxSeasonProject,
  TaxSeasonStatus,
} from "../tax-season-domain";
import type { TaxSeasonConfigurationProvider } from "./tax-season-configuration-provider";

type PersistentTaxSeasonReader = {
  listSeasons(): Promise<PersistentTaxSeasonConfiguration[]>;
};

export class OperationalTaxSeasonConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperationalTaxSeasonConfigurationError";
  }
}

const persistentTaxSeasonReader: PersistentTaxSeasonReader = {
  listSeasons: listPersistentTaxSeasons,
};

function mapStatus(
  status: PersistentTaxSeasonConfiguration["status"],
): TaxSeasonStatus {
  return status === "upcoming" ? "planned" : status;
}

function comparePersistentProjects(
  left: PersistentTaxSeasonConfiguration["projects"][number],
  right: PersistentTaxSeasonConfiguration["projects"][number],
) {
  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }

  return left.asanaProjectGid.localeCompare(right.asanaProjectGid);
}

function configurationError(message: string): never {
  throw new OperationalTaxSeasonConfigurationError(message);
}

function validateAndMapSeasons(
  persistentSeasons: PersistentTaxSeasonConfiguration[],
): TaxSeason[] {
  const activeSeasons = persistentSeasons.filter(
    (season) => season.status === "active",
  );
  const defaultSeasons = persistentSeasons.filter(
    (season) => season.isDefault,
  );

  if (activeSeasons.length !== 1) {
    configurationError(
      "Operational Tax Season configuration must contain exactly one active season.",
    );
  }

  if (defaultSeasons.length !== 1) {
    configurationError(
      "Operational Tax Season configuration must contain exactly one default season.",
    );
  }

  if (activeSeasons[0]?.id !== defaultSeasons[0]?.id) {
    configurationError(
      "The active and default Tax Season must be the same season.",
    );
  }

  if (
    persistentSeasons.some(
      (season) => season.status === "archived" && season.isDefault,
    )
  ) {
    configurationError("An archived Tax Season cannot be current or default.");
  }

  const seenProjectGids = new Set<string>();

  return persistentSeasons
    .map((season): TaxSeason => {
      const orderedProjects = [...season.projects].sort(
        comparePersistentProjects,
      );

      for (const project of orderedProjects) {
        const projectGid = project.asanaProjectGid.trim();

        if (!projectGid) {
          configurationError(
            `Tax Season ${season.code} has a project without an Asana project GID.`,
          );
        }

        if (seenProjectGids.has(projectGid)) {
          configurationError(
            "Operational Tax Season configuration contains a duplicate Asana project GID.",
          );
        }

        seenProjectGids.add(projectGid);

        if (
          !(project.validatedAt instanceof Date) ||
          !Number.isFinite(project.validatedAt.getTime())
        ) {
          configurationError(
            `Tax Season ${season.code} has a project without valid Asana validation metadata.`,
          );
        }
      }

      const projects: TaxSeasonProject[] = orderedProjects.map((project) => ({
        id: project.id,
        name: project.asanaProjectName,
        asanaProjectGid: project.asanaProjectGid.trim(),
        enabled: project.enabled,
      }));

      if (!projects.some((project) => project.enabled)) {
        configurationError(
          `Tax Season ${season.code} does not have an enabled validated Asana project.`,
        );
      }

      return {
        id: season.code,
        year: season.year,
        name: season.name,
        status: mapStatus(season.status),
        projects,
      };
    })
    .sort((left, right) => right.year - left.year || left.id.localeCompare(right.id));
}

export function createPostgresTaxSeasonConfigurationProvider(
  reader: PersistentTaxSeasonReader = persistentTaxSeasonReader,
): TaxSeasonConfigurationProvider {
  async function loadSeasons() {
    return validateAndMapSeasons(await reader.listSeasons());
  }

  return {
    async listSeasons() {
      return loadSeasons();
    },

    async getSeasonByCode(code) {
      const normalizedCode = code.trim();
      const seasons = await loadSeasons();

      return seasons.find((season) => season.id === normalizedCode) ?? null;
    },

    async getCurrentSeason() {
      const seasons = await loadSeasons();
      const currentSeason = seasons.find((season) => season.status === "active");

      return (
        currentSeason ??
        configurationError("No current operational Tax Season is available.")
      );
    },
  };
}

/** Explicit verification-only provider; it is not selected by runtime code. */
export const postgresTaxSeasonConfigurationProvider =
  createPostgresTaxSeasonConfigurationProvider();
