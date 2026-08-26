import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import type { ValidatedAsanaProject } from "../src/lib/asana/validate-project";
import { requireLocalSalinasDatabase } from "./require-local-database";

requireLocalSalinasDatabase();

class VerificationRollback extends Error {}

async function main() {
  const [databaseClient, schema, administration, authentication, asana, api] =
    await Promise.all([
      import("../src/lib/db/client"),
      import("../src/lib/db/schema"),
      import("../src/features/settings/tax-season-admin.service"),
      import("../src/lib/auth/staff-api-auth"),
      import("../src/lib/asana/validate-project"),
      import("../src/features/settings/settings-api-response"),
    ]);
  const database = databaseClient.getDatabase();

  const unauthorized = await authentication.requireStaffApiRequest(
    new NextRequest("http://localhost/api/settings/tax-seasons", {
      method: "POST",
      headers: { origin: "http://localhost", host: "localhost" },
    }),
    { mutation: true },
  );
  assert.equal(unauthorized?.status, 401);

  assert.throws(
    () => asana.normalizeAsanaProjectGid("invalid project"),
    (error) =>
      error instanceof asana.AsanaProjectValidationError &&
      error.code === "invalid-gid",
  );
  const authoritativeProject = await asana.validateAsanaProject(
    "999000000000001",
    async () => ({
      data: {
        gid: "999000000000001",
        name: "Authoritative Asana Project",
        archived: false,
        workspace: { gid: "111", name: "RCBS" },
      },
    }),
  );
  assert.equal(authoritativeProject.name, "Authoritative Asana Project");

  const safeResponse = api.settingsApiError(
    new administration.SettingsAdministrationError(
      "validation",
      "Safe staff-facing validation message.",
    ),
  );
  assert.equal(safeResponse.status, 400);
  assert.deepEqual(await safeResponse.json(), {
    success: false,
    error: "Safe staff-facing validation message.",
  });

  let clockTick = 0;
  const nextTimestamp = () =>
    new Date(Date.UTC(2035, 0, 1, 0, 0, clockTick++));
  const fakeProjectValidator = async (
    gid: unknown,
  ): Promise<ValidatedAsanaProject> => {
    const normalized = asana.normalizeAsanaProjectGid(gid);

    return {
      gid: normalized,
      name: `Authoritative ${normalized.slice(-3)}`,
      archived: false,
      modifiedAt: null,
      team: null,
      workspace: { gid: "111", name: "RCBS" },
      validatedAt: nextTimestamp(),
    };
  };

  try {
    await database.transaction(async (transaction) => {
      const service = administration.createTaxSeasonAdministrationService({
        database: transaction,
        validateProject: fakeProjectValidator,
        now: nextTimestamp,
      });

      await assert.rejects(
        service.createTaxSeason({
          code: "Invalid Code",
          year: 1999,
          name: "",
        }),
        (error) =>
          error instanceof administration.SettingsAdministrationError &&
          error.code === "validation",
      );

      const firstSeason = await service.createTaxSeason({
        code: "settings-verification-a",
        year: 2198,
        name: "Settings Verification A",
      });
      assert.ok(firstSeason);
      assert.equal(firstSeason.status, "upcoming");
      assert.equal(firstSeason.isDefault, false);

      await assert.rejects(
        transaction.transaction(async (savepoint) => {
          const duplicateService =
            administration.createTaxSeasonAdministrationService({
              database: savepoint,
              validateProject: fakeProjectValidator,
              now: nextTimestamp,
            });
          await duplicateService.createTaxSeason({
            code: "settings-verification-a",
            year: 2197,
            name: "Duplicate",
          });
        }),
        (error) =>
          error instanceof administration.SettingsAdministrationError &&
          error.code === "conflict",
      );

      const secondSeason = await service.createTaxSeason({
        code: "settings-verification-b",
        year: 2199,
        name: "Settings Verification B",
      });
      assert.ok(secondSeason);

      const archivedSeason = await service.createTaxSeason({
        code: "settings-verification-archived",
        year: 2196,
        name: "Settings Verification Archived",
        status: "archived",
      });
      assert.ok(archivedSeason);
      await assert.rejects(
        service.setCurrentTaxSeason(archivedSeason.id),
        (error) =>
          error instanceof administration.SettingsAdministrationError &&
          error.code === "validation",
      );

      await service.setCurrentTaxSeason(firstSeason.id);
      await service.setCurrentTaxSeason(secondSeason.id);
      const [currentCounts] = await transaction
        .select({
          active: sql<number>`count(*) filter (where ${schema.taxSeason.status} = 'active')::int`,
          defaults: sql<number>`count(*) filter (where ${schema.taxSeason.isDefault} = true)::int`,
        })
        .from(schema.taxSeason);
      assert.equal(currentCounts?.active, 1);
      assert.equal(currentCounts?.defaults, 1);
      const [demotedFirst] = await transaction
        .select()
        .from(schema.taxSeason)
        .where(eq(schema.taxSeason.id, firstSeason.id));
      assert.equal(demotedFirst?.status, "upcoming");
      assert.equal(demotedFirst?.isDefault, false);

      const firstProject = await service.assignProject({
        taxSeasonId: secondSeason.id,
        asanaProjectGid: "999000000000101",
        priority: 0,
      });
      const secondProject = await service.assignProject({
        taxSeasonId: secondSeason.id,
        asanaProjectGid: "999000000000102",
        priority: 1,
      });
      assert.equal(firstProject?.asanaProjectName, "Authoritative 101");

      await assert.rejects(
        transaction.transaction(async (savepoint) => {
          const duplicateProjectService =
            administration.createTaxSeasonAdministrationService({
              database: savepoint,
              validateProject: fakeProjectValidator,
              now: nextTimestamp,
            });
          await duplicateProjectService.assignProject({
            taxSeasonId: firstSeason.id,
            asanaProjectGid: "999000000000101",
          });
        }),
        (error) =>
          error instanceof administration.SettingsAdministrationError &&
          error.code === "conflict",
      );

      assert.ok(firstProject && secondProject);
      const disabled = await service.setProjectEnabled({
        id: firstProject.id,
        enabled: false,
      });
      assert.equal(disabled?.enabled, false);
      assert.notEqual(
        disabled?.updatedAt.getTime(),
        firstProject.updatedAt.getTime(),
      );
      const enabled = await service.setProjectEnabled({
        id: firstProject.id,
        enabled: true,
      });
      assert.equal(enabled?.enabled, true);

      const reordered = await service.reorderProjects({
        taxSeasonId: secondSeason.id,
        projectIds: [secondProject.id, firstProject.id],
      });
      assert.deepEqual(
        reordered.map((project) => ({ id: project.id, priority: project.priority })),
        [
          { id: secondProject.id, priority: 0 },
          { id: firstProject.id, priority: 1 },
        ],
      );

      const [currentSecond] = await transaction
        .select()
        .from(schema.taxSeason)
        .where(
          and(
            eq(schema.taxSeason.id, secondSeason.id),
            eq(schema.taxSeason.status, "active"),
            eq(schema.taxSeason.isDefault, true),
          ),
        );
      assert.ok(currentSecond, "Current-season transition was not atomic.");

      throw new VerificationRollback();
    });
  } catch (error) {
    if (!(error instanceof VerificationRollback)) throw error;
  } finally {
    await databaseClient.getDatabasePool().end();
  }

  console.log("Settings administration verification passed and rolled back.");
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Settings administration verification failed.",
  );
  process.exitCode = 1;
});
