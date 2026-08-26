import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyTaxReturnTask } from "../src/features/tax-pipeline/classify-tax-return";
import {
  getActiveTaxSeason,
  getTaxSeasons,
} from "../src/features/tax-pipeline/tax-seasons";
import {
  getCurrentOperationalTaxSeason,
  getOperationalTaxSeasonByCode,
  listOperationalTaxSeasons,
} from "../src/features/tax-pipeline/configuration/operational-tax-season-configuration";

async function main() {
  const registrySeasons = getTaxSeasons();
  const listPromise = listOperationalTaxSeasons();

  assert.ok(listPromise instanceof Promise, "Provider list must be async.");

  const providerSeasons = await listPromise;
  assert.deepEqual(providerSeasons, registrySeasons);
  assert.equal(providerSeasons.length, 1);
  assert.equal(providerSeasons[0]?.id, "2026");
  assert.equal(providerSeasons[0]?.status, "active");

  const currentPromise = getCurrentOperationalTaxSeason();
  assert.ok(currentPromise instanceof Promise, "Current lookup must be async.");

  const [currentSeason, season2026, unknownSeason] = await Promise.all([
    currentPromise,
    getOperationalTaxSeasonByCode(" 2026 "),
    getOperationalTaxSeasonByCode("unknown"),
  ]);

  assert.deepEqual(currentSeason, getActiveTaxSeason());
  assert.deepEqual(season2026, registrySeasons[0]);
  assert.equal(unknownSeason, null);
  assert.equal(season2026?.projects[0]?.asanaProjectGid, registrySeasons[0]?.projects[0]?.asanaProjectGid);
  assert.equal(season2026?.projects[0]?.name, registrySeasons[0]?.projects[0]?.name);
  assert.equal(season2026?.projects[0]?.enabled, registrySeasons[0]?.projects[0]?.enabled);
  assert.deepEqual(
    season2026?.projects.map((project) => project.id),
    registrySeasons[0]?.projects.map((project) => project.id),
  );

  providerSeasons[0]!.name = "Mutated outside provider";
  providerSeasons[0]!.projects[0]!.name = "Mutated project";
  providerSeasons[0]!.projects.reverse();

  const freshSeasons = await listOperationalTaxSeasons();
  assert.deepEqual(freshSeasons, registrySeasons);

  const classificationResult = classifyTaxReturnTask(
    { memberships: [] },
    {
      ...currentSeason,
      projects: currentSeason.projects.map((project) => ({
        ...project,
        asanaProjectGid:
          project.asanaProjectGid || "verification-project-gid",
      })),
    },
  );
  assert.ok(!(classificationResult instanceof Promise));

  const classifierSource = readFileSync(
    "src/features/tax-pipeline/classify-tax-return.ts",
    "utf8",
  );
  assert.ok(!classifierSource.includes("operational-tax-season-configuration"));
  assert.ok(!classifierSource.includes("@/lib/db"));

  const operationalSources = [
    "src/features/tax-pipeline/configuration/tax-season-configuration-provider.ts",
    "src/features/tax-pipeline/configuration/code-tax-season-configuration-provider.ts",
    "src/features/tax-pipeline/configuration/operational-tax-season-configuration.ts",
  ].map((path) => readFileSync(path, "utf8")).join("\n");

  for (const forbiddenDependency of [
    "@/lib/db",
    "drizzle-orm",
    "DATABASE_URL",
    "tax-season-repository",
  ]) {
    assert.ok(!operationalSources.includes(forbiddenDependency));
  }

  console.log("Operational Tax Season provider contract verification passed.");
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Operational Tax Season provider verification failed.",
  );
  process.exitCode = 1;
});
