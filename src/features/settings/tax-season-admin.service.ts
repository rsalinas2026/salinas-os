import "server-only";

import { and, asc, eq, ne, sql } from "drizzle-orm";
import type { SalinasDatabase } from "@/lib/db/client";
import { getDatabase } from "@/lib/db/client";
import { requireLocalDevelopmentDatabase } from "@/lib/db/local-development-guard";
import {
  taxSeason,
  taxSeasonProject,
  type PersistentTaxSeasonStatus,
} from "@/lib/db/schema";
import { listPersistentTaxSeasons } from "@/lib/db/tax-season-repository";
import {
  AsanaProjectValidationError,
  validateAsanaProject,
  type ValidatedAsanaProject,
} from "@/lib/asana/validate-project";

type AdministrationDatabase = Pick<
  SalinasDatabase,
  "select" | "insert" | "update" | "delete" | "transaction"
>;

type ProjectValidator = (gid: unknown) => Promise<ValidatedAsanaProject>;

type AdministrationDependencies = {
  database?: AdministrationDatabase;
  validateProject?: ProjectValidator;
  now?: () => Date;
};

export type SettingsAdministrationErrorCode =
  | "validation"
  | "not-found"
  | "conflict"
  | "external-service"
  | "configuration";

export class SettingsAdministrationError extends Error {
  constructor(
    public readonly code: SettingsAdministrationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SettingsAdministrationError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEASON_CODE_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;

function requiredUuid(value: unknown, label: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value.trim())) {
    throw new SettingsAdministrationError(
      "validation",
      `${label} is invalid.`,
    );
  }

  return value.trim();
}

function seasonCode(value: unknown): string {
  if (typeof value !== "string") {
    throw new SettingsAdministrationError(
      "validation",
      "Tax Season code is required.",
    );
  }

  const normalized = value.trim().toLowerCase();

  if (!SEASON_CODE_PATTERN.test(normalized)) {
    throw new SettingsAdministrationError(
      "validation",
      "Tax Season code must contain only lowercase letters, numbers, and hyphens.",
    );
  }

  return normalized;
}

function seasonYear(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 2000 || Number(value) > 2200) {
    throw new SettingsAdministrationError(
      "validation",
      "Tax Season year must be a whole number between 2000 and 2200.",
    );
  }

  return Number(value);
}

function requiredName(value: unknown): string {
  if (typeof value !== "string") {
    throw new SettingsAdministrationError(
      "validation",
      "Tax Season name is required.",
    );
  }

  const normalized = value.trim();

  if (!normalized || normalized.length > 120) {
    throw new SettingsAdministrationError(
      "validation",
      "Tax Season name must contain 1 to 120 characters.",
    );
  }

  return normalized;
}

function requestedStatus(value: unknown): PersistentTaxSeasonStatus {
  if (value === "upcoming" || value === "active" || value === "archived") {
    return value;
  }

  throw new SettingsAdministrationError(
    "validation",
    "Tax Season status is invalid.",
  );
}

function priority(value: unknown): number {
  if (
    !Number.isInteger(value) ||
    Number(value) < 0 ||
    Number(value) > 1_000_000
  ) {
    throw new SettingsAdministrationError(
      "validation",
      "Project priority must be a whole number between 0 and 1000000.",
    );
  }

  return Number(value);
}

function mapDatabaseError(error: unknown): never {
  let candidate: unknown = error;
  let databaseCode: string | null = null;

  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof candidate !== "object" || candidate === null) break;

    if ("code" in candidate) {
      databaseCode = String(candidate.code);
      break;
    }

    candidate = "cause" in candidate ? candidate.cause : null;
  }

  if (databaseCode === "23505") {
    throw new SettingsAdministrationError(
      "conflict",
      "The requested Tax Season or project configuration already exists.",
    );
  }

  if (databaseCode === "23503" || databaseCode === "23514") {
    throw new SettingsAdministrationError(
      "validation",
      "The requested configuration violates a required safety rule.",
    );
  }

  throw error;
}

export function createTaxSeasonAdministrationService(
  dependencies: AdministrationDependencies = {},
) {
  const database = dependencies.database ?? getDatabase();
  const validateProject = dependencies.validateProject ?? validateAsanaProject;
  const now = dependencies.now ?? (() => new Date());

  function assertLocalDatabase() {
    try {
      requireLocalDevelopmentDatabase();
    } catch {
      throw new SettingsAdministrationError(
        "configuration",
        "Settings administration is not configured for this environment.",
      );
    }
  }

  async function requireSeason(id: unknown) {
    const normalizedId = requiredUuid(id, "Tax Season ID");
    const [season] = await database
      .select()
      .from(taxSeason)
      .where(eq(taxSeason.id, normalizedId))
      .limit(1);

    if (!season) {
      throw new SettingsAdministrationError(
        "not-found",
        "Tax Season was not found.",
      );
    }

    return season;
  }

  async function requireProject(id: unknown) {
    const normalizedId = requiredUuid(id, "Project assignment ID");
    const [project] = await database
      .select()
      .from(taxSeasonProject)
      .where(eq(taxSeasonProject.id, normalizedId))
      .limit(1);

    if (!project) {
      throw new SettingsAdministrationError(
        "not-found",
        "Project assignment was not found.",
      );
    }

    return project;
  }

  async function validateProjectForAdministration(gid: unknown) {
    try {
      return await validateProject(gid);
    } catch (error) {
      if (error instanceof AsanaProjectValidationError) {
        throw new SettingsAdministrationError(
          error.code === "api-unavailable"
            ? "external-service"
            : "validation",
          error.message,
        );
      }

      throw error;
    }
  }

  return {
    async listTaxSeasons() {
      assertLocalDatabase();
      return listPersistentTaxSeasons();
    },

    async createTaxSeason(input: {
      code: unknown;
      year: unknown;
      name: unknown;
      status?: unknown;
    }) {
      assertLocalDatabase();
      const status =
        input.status === undefined ? "upcoming" : requestedStatus(input.status);

      if (status === "active") {
        throw new SettingsAdministrationError(
          "validation",
          "Create the Tax Season as upcoming, then use Set Current Tax Season.",
        );
      }

      try {
        const [created] = await database
          .insert(taxSeason)
          .values({
            code: seasonCode(input.code),
            year: seasonYear(input.year),
            name: requiredName(input.name),
            status,
            isDefault: false,
          })
          .returning();

        return created;
      } catch (error) {
        mapDatabaseError(error);
      }
    },

    async updateTaxSeason(input: {
      id: unknown;
      code?: unknown;
      year?: unknown;
      name?: unknown;
      status?: unknown;
    }) {
      assertLocalDatabase();
      const season = await requireSeason(input.id);
      const updates: Partial<typeof taxSeason.$inferInsert> = {
        updatedAt: now(),
      };

      if (input.code !== undefined) updates.code = seasonCode(input.code);
      if (input.year !== undefined) updates.year = seasonYear(input.year);
      if (input.name !== undefined) updates.name = requiredName(input.name);
      if (input.status !== undefined) {
        const status = requestedStatus(input.status);

        if (status === "active") {
          throw new SettingsAdministrationError(
            "validation",
            "Use Set Current Tax Season to activate a season.",
          );
        }

        if (status === "archived") {
          throw new SettingsAdministrationError(
            "validation",
            "Use Archive Tax Season to archive a season safely.",
          );
        }

        if (season.status === "active") {
          throw new SettingsAdministrationError(
            "conflict",
            "Set another current Tax Season before changing the active season.",
          );
        }

        updates.status = status;
      }

      if (Object.keys(updates).length === 1) {
        throw new SettingsAdministrationError(
          "validation",
          "Provide at least one Tax Season field to update.",
        );
      }

      try {
        const [updated] = await database
          .update(taxSeason)
          .set(updates)
          .where(eq(taxSeason.id, season.id))
          .returning();

        return updated;
      } catch (error) {
        mapDatabaseError(error);
      }
    },

    async setCurrentTaxSeason(id: unknown) {
      assertLocalDatabase();
      const target = await requireSeason(id);

      if (target.status === "archived") {
        throw new SettingsAdministrationError(
          "validation",
          "An archived Tax Season cannot become current.",
        );
      }

      try {
        return await database.transaction(async (transaction) => {
          const timestamp = now();
          await transaction
            .update(taxSeason)
            .set({ status: "upcoming", updatedAt: timestamp })
            .where(
              and(
                eq(taxSeason.status, "active"),
                ne(taxSeason.id, target.id),
              ),
            );
          await transaction
            .update(taxSeason)
            .set({ isDefault: false, updatedAt: timestamp })
            .where(
              and(
                eq(taxSeason.isDefault, true),
                ne(taxSeason.id, target.id),
              ),
            );
          const [updated] = await transaction
            .update(taxSeason)
            .set({ status: "active", isDefault: true, updatedAt: timestamp })
            .where(eq(taxSeason.id, target.id))
            .returning();

          return updated;
        });
      } catch (error) {
        mapDatabaseError(error);
      }
    },

    async archiveTaxSeason(id: unknown) {
      assertLocalDatabase();
      const target = await requireSeason(id);

      if (target.status === "active") {
        throw new SettingsAdministrationError(
          "conflict",
          "Set another current Tax Season before archiving this one.",
        );
      }

      const [updated] = await database
        .update(taxSeason)
        .set({ status: "archived", isDefault: false, updatedAt: now() })
        .where(eq(taxSeason.id, target.id))
        .returning();

      return updated;
    },

    async validateAsanaProject(gid: unknown) {
      assertLocalDatabase();
      return validateProjectForAdministration(gid);
    },

    async assignProject(input: {
      taxSeasonId: unknown;
      asanaProjectGid: unknown;
      priority?: unknown;
    }) {
      assertLocalDatabase();
      const season = await requireSeason(input.taxSeasonId);

      if (season.status === "archived") {
        throw new SettingsAdministrationError(
          "validation",
          "Projects cannot be assigned to an archived Tax Season.",
        );
      }

      const validated = await validateProjectForAdministration(
        input.asanaProjectGid,
      );

      if (validated.archived) {
        throw new SettingsAdministrationError(
          "validation",
          "An archived Asana project cannot be assigned.",
        );
      }

      const [existing] = await database
        .select({ taxSeasonId: taxSeasonProject.taxSeasonId })
        .from(taxSeasonProject)
        .where(eq(taxSeasonProject.asanaProjectGid, validated.gid))
        .limit(1);

      if (existing) {
        throw new SettingsAdministrationError(
          "conflict",
          existing.taxSeasonId === season.id
            ? "This Asana project is already assigned to this Tax Season."
            : "This Asana project is assigned to another Tax Season and cannot be moved implicitly.",
        );
      }

      let requestedPriority: number;

      if (input.priority === undefined) {
        const [highest] = await database
          .select({ priority: taxSeasonProject.priority })
          .from(taxSeasonProject)
          .where(eq(taxSeasonProject.taxSeasonId, season.id))
          .orderBy(sql`${taxSeasonProject.priority} desc`)
          .limit(1);
        requestedPriority = (highest?.priority ?? -1) + 1;
        priority(requestedPriority);
      } else {
        requestedPriority = priority(input.priority);
      }

      try {
        const [created] = await database
          .insert(taxSeasonProject)
          .values({
            taxSeasonId: season.id,
            asanaProjectGid: validated.gid,
            asanaProjectName: validated.name,
            enabled: true,
            priority: requestedPriority,
            validatedAt: validated.validatedAt,
          })
          .returning();

        return created;
      } catch (error) {
        mapDatabaseError(error);
      }
    },

    async setProjectEnabled(input: { id: unknown; enabled: unknown }) {
      assertLocalDatabase();
      const project = await requireProject(input.id);

      if (typeof input.enabled !== "boolean") {
        throw new SettingsAdministrationError(
          "validation",
          "Project enabled state must be true or false.",
        );
      }

      if (!input.enabled && project.enabled) {
        const [season] = await database
          .select()
          .from(taxSeason)
          .where(eq(taxSeason.id, project.taxSeasonId))
          .limit(1);
        const [enabledCount] = await database
          .select({ count: sql<number>`count(*)::int` })
          .from(taxSeasonProject)
          .where(
            and(
              eq(taxSeasonProject.taxSeasonId, project.taxSeasonId),
              eq(taxSeasonProject.enabled, true),
            ),
          );

        if (
          (season?.status === "active" || season?.isDefault) &&
          enabledCount?.count === 1
        ) {
          throw new SettingsAdministrationError(
            "conflict",
            "The current Tax Season must retain at least one enabled project.",
          );
        }
      }

      const [updated] = await database
        .update(taxSeasonProject)
        .set({ enabled: input.enabled, updatedAt: now() })
        .where(eq(taxSeasonProject.id, project.id))
        .returning();

      return updated;
    },

    async reorderProjects(input: {
      taxSeasonId: unknown;
      projectIds: unknown;
    }) {
      assertLocalDatabase();
      const season = await requireSeason(input.taxSeasonId);

      if (!Array.isArray(input.projectIds) || input.projectIds.length === 0) {
        throw new SettingsAdministrationError(
          "validation",
          "Provide every project assignment in the desired order.",
        );
      }

      const projectIds = input.projectIds.map((id) =>
        requiredUuid(id, "Project assignment ID"),
      );

      if (new Set(projectIds).size !== projectIds.length) {
        throw new SettingsAdministrationError(
          "validation",
          "Project ordering cannot contain duplicate assignments.",
        );
      }

      const currentProjects = await database
        .select({
          id: taxSeasonProject.id,
          priority: taxSeasonProject.priority,
        })
        .from(taxSeasonProject)
        .where(eq(taxSeasonProject.taxSeasonId, season.id))
        .orderBy(asc(taxSeasonProject.priority));
      const currentIds = new Set(currentProjects.map((project) => project.id));

      if (
        currentIds.size !== projectIds.length ||
        projectIds.some((id) => !currentIds.has(id))
      ) {
        throw new SettingsAdministrationError(
          "validation",
          "Project ordering must include every assignment exactly once.",
        );
      }

      return database.transaction(async (transaction) => {
        const timestamp = now();
        const highestPriority = Math.max(
          ...currentProjects.map((project) => project.priority),
          0,
        );
        const temporaryOffset = highestPriority + projectIds.length + 1;
        await transaction
          .update(taxSeasonProject)
          .set({
            priority: sql`${taxSeasonProject.priority} + ${temporaryOffset}`,
          })
          .where(eq(taxSeasonProject.taxSeasonId, season.id));

        for (const [newPriority, id] of projectIds.entries()) {
          await transaction
            .update(taxSeasonProject)
            .set({ priority: newPriority, updatedAt: timestamp })
            .where(eq(taxSeasonProject.id, id));
        }

        return database
          .select()
          .from(taxSeasonProject)
          .where(eq(taxSeasonProject.taxSeasonId, season.id))
          .orderBy(
            asc(taxSeasonProject.priority),
            asc(taxSeasonProject.asanaProjectGid),
          );
      });
    },

    async removeProject(id: unknown) {
      assertLocalDatabase();
      const project = await requireProject(id);
      const [season] = await database
        .select()
        .from(taxSeason)
        .where(eq(taxSeason.id, project.taxSeasonId))
        .limit(1);

      if (project.enabled && (season?.status === "active" || season?.isDefault)) {
        const [enabledCount] = await database
          .select({ count: sql<number>`count(*)::int` })
          .from(taxSeasonProject)
          .where(
            and(
              eq(taxSeasonProject.taxSeasonId, project.taxSeasonId),
              eq(taxSeasonProject.enabled, true),
            ),
          );

        if (enabledCount?.count === 1) {
          throw new SettingsAdministrationError(
            "conflict",
            "The current Tax Season must retain at least one enabled project.",
          );
        }
      }

      const [removed] = await database
        .delete(taxSeasonProject)
        .where(eq(taxSeasonProject.id, project.id))
        .returning();

      return removed;
    },
  };
}

let defaultAdministration:
  | ReturnType<typeof createTaxSeasonAdministrationService>
  | undefined;

export function getTaxSeasonAdministration() {
  defaultAdministration ??= createTaxSeasonAdministrationService();
  return defaultAdministration;
}
