import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  TAX_SEASON_PROJECT_CANONICAL_ORDER,
  TAX_SEASON_STATUSES,
  taxSeason,
  taxSeasonProject,
} from "../src/lib/db/schema";
import {
  DatabaseConfigurationError,
  validateDatabaseUrl,
} from "../src/lib/db/database-url";

function sorted(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

const seasonConfig = getTableConfig(taxSeason);
const projectConfig = getTableConfig(taxSeasonProject);

assert.equal(seasonConfig.name, "tax_season");
assert.deepEqual(
  sorted(seasonConfig.columns.map((column) => column.name)),
  sorted([
    "id",
    "code",
    "year",
    "name",
    "status",
    "is_default",
    "created_at",
    "updated_at",
  ]),
);
assert.deepEqual(TAX_SEASON_STATUSES, ["upcoming", "active", "archived"]);
assert.deepEqual(
  sorted(seasonConfig.uniqueConstraints.map((constraint) => constraint.getName() ?? "")),
  ["tax_season_code_uq", "tax_season_year_uq"],
);
assert.deepEqual(
  sorted(seasonConfig.checks.map((constraint) => constraint.name)),
  sorted([
    "tax_season_name_nonempty_chk",
    "tax_season_status_chk",
    "tax_season_archived_not_default_chk",
  ]),
);
assert.deepEqual(
  sorted(seasonConfig.indexes.map((databaseIndex) => databaseIndex.config.name ?? "")),
  sorted([
    "tax_season_one_active_idx",
    "tax_season_one_default_idx",
    "tax_season_status_idx",
  ]),
);

assert.equal(projectConfig.name, "tax_season_project");
assert.deepEqual(
  sorted(projectConfig.uniqueConstraints.map((constraint) => constraint.getName() ?? "")),
  [
    "tax_season_project_asana_gid_uq",
    "tax_season_project_season_priority_uq",
  ],
);
assert.equal(projectConfig.foreignKeys.length, 1);
assert.equal(projectConfig.foreignKeys[0]?.onDelete, "restrict");
assert.deepEqual(
  sorted(projectConfig.checks.map((constraint) => constraint.name)),
  sorted([
    "tax_season_project_name_nonempty_chk",
    "tax_season_project_priority_chk",
  ]),
);
assert.deepEqual(TAX_SEASON_PROJECT_CANONICAL_ORDER, [
  { column: "priority", direction: "asc" },
  { column: "asanaProjectGid", direction: "asc" },
]);

const migrationFiles = readdirSync(join(process.cwd(), "drizzle"))
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort();
assert.deepEqual(migrationFiles, ["0000_persistence_foundation.sql"]);

const migrationSql = readFileSync(
  join(process.cwd(), "drizzle", migrationFiles[0]),
  "utf8",
);
const requiredMigrationFragments = [
  'CONSTRAINT "tax_season_code_uq" UNIQUE("code")',
  'CONSTRAINT "tax_season_year_uq" UNIQUE("year")',
  'CONSTRAINT "tax_season_status_chk" CHECK',
  "in ('upcoming', 'active', 'archived')",
  'CONSTRAINT "tax_season_archived_not_default_chk" CHECK',
  'CONSTRAINT "tax_season_project_asana_gid_uq" UNIQUE("asana_project_gid")',
  'CONSTRAINT "tax_season_project_season_priority_uq" UNIQUE("tax_season_id","priority")',
  'CONSTRAINT "tax_season_project_priority_chk" CHECK',
  'ON DELETE restrict',
  'CREATE UNIQUE INDEX "tax_season_one_active_idx"',
  'WHERE "tax_season"."status" = \'active\'',
  'CREATE UNIQUE INDEX "tax_season_one_default_idx"',
  'WHERE "tax_season"."is_default" = true',
  'CREATE INDEX "tax_season_status_idx"',
  'CREATE INDEX "tax_season_project_season_idx"',
  'CREATE INDEX "tax_season_project_enabled_order_idx"',
];

for (const fragment of requiredMigrationFragments) {
  assert.ok(
    migrationSql.includes(fragment),
    `Initial migration is missing required SQL fragment: ${fragment}`,
  );
}

assert.throws(
  () => validateDatabaseUrl(undefined),
  DatabaseConfigurationError,
);
assert.throws(
  () => validateDatabaseUrl("https://example.com/database"),
  DatabaseConfigurationError,
);
assert.throws(
  () => validateDatabaseUrl("postgresql://localhost/database"),
  DatabaseConfigurationError,
);
assert.equal(
  validateDatabaseUrl(
    "postgresql://salinas_test:test-password@localhost:5432/salinas_test",
  ),
  "postgresql://salinas_test:test-password@localhost:5432/salinas_test",
);

const databaseClientSource = readFileSync(
  join(process.cwd(), "src/lib/db/client.ts"),
  "utf8",
);
assert.ok(databaseClientSource.startsWith('import "server-only";'));
assert.ok(databaseClientSource.includes("globalThis as DatabaseGlobal"));
assert.ok(databaseClientSource.includes("validateDatabaseUrl(process.env.DATABASE_URL)"));

const currentTaxSeasonSource = readFileSync(
  join(process.cwd(), "src/features/tax-pipeline/tax-seasons.ts"),
  "utf8",
);
assert.ok(!currentTaxSeasonSource.includes("@/lib/db"));
assert.ok(!currentTaxSeasonSource.includes("../../lib/db"));

console.log("Persistence Foundation 1A verification passed.");
