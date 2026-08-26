import assert from "node:assert/strict";
import { requireLocalSalinasDatabase } from "./require-local-database";

requireLocalSalinasDatabase();

async function main() {
  const [codeConfiguration, repository, databaseClient] = await Promise.all([
    import("../src/features/tax-pipeline/tax-seasons"),
    import("../src/lib/db/tax-season-repository"),
    import("../src/lib/db/client"),
  ]);
  const { TAX_SEASON_PROJECT_CANONICAL_ORDER } = await import(
    "../src/lib/db/schema"
  );
  const codeSeason = codeConfiguration.getTaxSeasonByYear(2026);

  try {
    const [databaseSeason, defaultSeason, activeSeason, currentSeason, seasons] =
      await Promise.all([
        repository.getPersistentTaxSeasonByCode(codeSeason.id),
        repository.getDefaultPersistentTaxSeason(),
        repository.getActivePersistentTaxSeason(),
        repository.getCurrentPersistentTaxSeason(),
        repository.listPersistentTaxSeasons(),
      ]);

    assert.ok(databaseSeason, "Persistent 2026 Tax Season is missing.");
    assert.equal(databaseSeason.code, codeSeason.id);
    assert.equal(databaseSeason.year, codeSeason.year);
    assert.equal(databaseSeason.name, codeSeason.name);
    assert.equal(databaseSeason.status, "active");
    assert.equal(databaseSeason.isDefault, true);

    const futureSeason = seasons.find((season) => season.year === 2027);
    assert.ok(futureSeason, "Persistent 2027 Tax Season is missing.");
    assert.equal(futureSeason.code, "2027");
    assert.equal(futureSeason.name, "2027 Tax Season");
    assert.equal(futureSeason.status, "upcoming");
    assert.equal(futureSeason.isDefault, false);
    assert.equal(futureSeason.projects.length, 1);
    assert.equal(futureSeason.projects[0]?.asanaProjectGid, "1214909687451352");
    assert.equal(futureSeason.projects[0]?.asanaProjectName, "2027 TAX SEASON");
    assert.equal(futureSeason.projects[0]?.enabled, true);
    assert.equal(futureSeason.projects[0]?.priority, 0);
    assert.ok(
      futureSeason.projects[0]?.validatedAt instanceof Date &&
        Number.isFinite(futureSeason.projects[0].validatedAt.getTime()),
      "Persistent 2027 Asana project must retain a valid validation timestamp.",
    );
    assert.equal(
      seasons.filter((season) => season.status === "active").length,
      1,
    );
    assert.equal(
      seasons.filter((season) => season.isDefault).length,
      1,
    );

    assert.deepEqual(
      databaseSeason.projects.map((project) => project.asanaProjectGid),
      codeSeason.projects.map((project) => project.asanaProjectGid),
    );
    assert.deepEqual(
      databaseSeason.projects.map((project) => project.asanaProjectName),
      codeSeason.projects.map((project) => project.name),
    );
    assert.deepEqual(
      databaseSeason.projects.map((project) => project.enabled),
      codeSeason.projects.map((project) => project.enabled),
    );
    assert.deepEqual(
      databaseSeason.projects.map((project) => project.priority),
      codeSeason.projects.map((_, priority) => priority),
    );
    assert.deepEqual(TAX_SEASON_PROJECT_CANONICAL_ORDER, [
      { column: "priority", direction: "asc" },
      { column: "asanaProjectGid", direction: "asc" },
    ]);
    assert.deepEqual(
      repository
        .getEnabledPersistentSeasonProjects(databaseSeason)
        .map((project) => project.asanaProjectGid),
      codeConfiguration
        .getEnabledSeasonProjects(codeSeason)
        .map((project) => project.asanaProjectGid),
    );

    assert.equal(defaultSeason?.code, codeSeason.id);
    assert.equal(activeSeason?.code, codeSeason.id);
    assert.equal(currentSeason?.code, codeSeason.id);

    const byId = await repository.getPersistentTaxSeasonById(
      databaseSeason.id,
    );
    assert.equal(byId?.code, codeSeason.id);

    const migrationResult = await databaseClient.getDatabasePool().query<{
      migration_count: string;
    }>(
      'select count(*)::text as migration_count from drizzle."__drizzle_migrations"',
    );
    assert.equal(migrationResult.rows[0]?.migration_count, "1");

    const tableResult = await databaseClient.getDatabasePool().query<{
      table_name: string;
    }>(
      `select table_name from information_schema.tables
       where table_schema = 'public'
         and table_name in ('tax_season', 'tax_season_project')`,
    );
    assert.deepEqual(
      tableResult.rows.map((row) => row.table_name).sort(),
      ["tax_season", "tax_season_project"],
    );

    const constraintResult = await databaseClient.getDatabasePool().query<{
      conname: string;
    }>(
      `select conname from pg_constraint
       where conrelid in ('tax_season'::regclass, 'tax_season_project'::regclass)`,
    );
    const constraintNames = new Set(
      constraintResult.rows.map((row) => row.conname),
    );
    for (const requiredConstraint of [
      "tax_season_code_uq",
      "tax_season_year_uq",
      "tax_season_name_nonempty_chk",
      "tax_season_status_chk",
      "tax_season_archived_not_default_chk",
      "tax_season_project_asana_gid_uq",
      "tax_season_project_season_priority_uq",
      "tax_season_project_name_nonempty_chk",
      "tax_season_project_priority_chk",
      "tax_season_project_tax_season_id_tax_season_id_fk",
    ]) {
      assert.ok(
        constraintNames.has(requiredConstraint),
        `Missing constraint: ${requiredConstraint}`,
      );
    }

    const indexResult = await databaseClient.getDatabasePool().query<{
      indexname: string;
    }>(
      `select indexname from pg_indexes
       where schemaname = 'public'
         and tablename in ('tax_season', 'tax_season_project')`,
    );
    const indexNames = new Set(indexResult.rows.map((row) => row.indexname));
    for (const requiredIndex of [
      "tax_season_one_active_idx",
      "tax_season_one_default_idx",
      "tax_season_status_idx",
      "tax_season_project_season_idx",
      "tax_season_project_enabled_order_idx",
    ]) {
      assert.ok(indexNames.has(requiredIndex), `Missing index: ${requiredIndex}`);
    }

    const readerSource = await import("node:fs").then(({ readFileSync }) =>
      readFileSync(
        "src/features/tax-pipeline/tax-seasons.ts",
        "utf8",
      ),
    );
    assert.ok(!readerSource.includes("tax-season-repository"));
    assert.ok(!readerSource.includes("@/lib/db"));

    console.log(
      "Persistent 2026 parity and 2027 configuration verification passed.",
    );
  } finally {
    await databaseClient.getDatabasePool().end();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Persistence parity check failed.",
  );
  process.exitCode = 1;
});
