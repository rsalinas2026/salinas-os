import "server-only";

import { getTaxSeasonByYear } from "@/features/tax-pipeline/tax-seasons";
import { getDatabase } from "../client";
import { taxSeason, taxSeasonProject } from "../schema";

const STATUS_BY_CODE_STATUS = {
  planned: "upcoming",
  active: "active",
  archived: "archived",
} as const;

export type SeededTaxSeasonLogicalState = {
  code: string;
  year: number;
  name: string;
  status: "upcoming" | "active" | "archived";
  isDefault: boolean;
  projects: Array<{
    asanaProjectGid: string;
    asanaProjectName: string;
    enabled: boolean;
    priority: number;
  }>;
};

export async function seedApproved2026TaxSeason(): Promise<SeededTaxSeasonLogicalState> {
  const configuredSeason = getTaxSeasonByYear(2026);
  const status = STATUS_BY_CODE_STATUS[configuredSeason.status];
  const projects = configuredSeason.projects.map((project, priority) => {
    const asanaProjectGid = project.asanaProjectGid.trim();

    if (!asanaProjectGid) {
      throw new Error(
        `The approved ${configuredSeason.year} project configuration is missing its Asana project GID.`,
      );
    }

    return {
      asanaProjectGid,
      asanaProjectName: project.name,
      enabled: project.enabled,
      priority,
    };
  });

  if (projects.length === 0) {
    throw new Error("The approved 2026 Tax Season has no configured projects.");
  }

  const database = getDatabase();

  await database.transaction(async (transaction) => {
    const now = new Date();
    const [seededSeason] = await transaction
      .insert(taxSeason)
      .values({
        code: configuredSeason.id,
        year: configuredSeason.year,
        name: configuredSeason.name,
        status,
        isDefault: configuredSeason.status === "active",
      })
      .onConflictDoUpdate({
        target: taxSeason.code,
        set: {
          year: configuredSeason.year,
          name: configuredSeason.name,
          status,
          isDefault: configuredSeason.status === "active",
          updatedAt: now,
        },
      })
      .returning({ id: taxSeason.id });

    if (!seededSeason) {
      throw new Error("The 2026 Tax Season seed did not return a season ID.");
    }

    for (const project of projects) {
      await transaction
        .insert(taxSeasonProject)
        .values({
          taxSeasonId: seededSeason.id,
          asanaProjectGid: project.asanaProjectGid,
          asanaProjectName: project.asanaProjectName,
          enabled: project.enabled,
          priority: project.priority,
          validatedAt: now,
        })
        .onConflictDoUpdate({
          target: taxSeasonProject.asanaProjectGid,
          set: {
            taxSeasonId: seededSeason.id,
            asanaProjectName: project.asanaProjectName,
            enabled: project.enabled,
            priority: project.priority,
            updatedAt: now,
          },
        });
    }
  });

  return {
    code: configuredSeason.id,
    year: configuredSeason.year,
    name: configuredSeason.name,
    status,
    isDefault: configuredSeason.status === "active",
    projects,
  };
}
