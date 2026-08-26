import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GET as getTaxSeasonsResponse } from "../src/app/api/tax-seasons/route";
import {
  getCurrentOperationalTaxSeason,
  listOperationalTaxSeasons,
  resolveOperationalTaxSeason,
} from "../src/features/tax-pipeline/configuration/operational-tax-season-configuration";
import { getTaxSeasons } from "../src/features/tax-pipeline/tax-seasons";

const migratedReaders = [
  "src/app/api/tax-seasons/route.ts",
  "src/app/api/asana/route.ts",
  "src/features/executive/executive.service.ts",
  "src/app/tax-returns/[gid]/page.tsx",
  "src/features/tax-pipeline/tax-pipeline.service.ts",
  "src/app/api/asana/projects/route.ts",
] as const;

async function main() {
  const registrySeasons = getTaxSeasons();
  const [operationalSeasons, currentSeason, explicitSeason] =
    await Promise.all([
      listOperationalTaxSeasons(),
      getCurrentOperationalTaxSeason(),
      resolveOperationalTaxSeason("2026"),
    ]);

  assert.deepEqual(operationalSeasons, registrySeasons);
  assert.deepEqual(currentSeason, registrySeasons[0]);
  assert.deepEqual(explicitSeason, registrySeasons[0]);
  assert.equal(operationalSeasons.length, 1);
  assert.equal(operationalSeasons.some((season) => season.id === "2027"), false);

  await assert.rejects(
    resolveOperationalTaxSeason("unknown"),
    /Unknown tax season: unknown/,
  );

  const taxSeasonResponse = await getTaxSeasonsResponse();
  assert.equal(taxSeasonResponse.status, 200);

  const taxSeasonPayload = (await taxSeasonResponse.json()) as {
    success: boolean;
    activeSeasonId: string;
    seasons: Array<{
      id: string;
      year: number;
      name: string;
      status: string;
      projectCount: number;
      enabledProjectCount: number;
      projects: Array<{
        id: string;
        name: string;
        asanaProjectGid: string;
        enabled: boolean;
      }>;
    }>;
  };

  assert.equal(taxSeasonPayload.success, true);
  assert.equal(taxSeasonPayload.activeSeasonId, "2026");
  assert.equal(taxSeasonPayload.seasons.length, 1);
  assert.equal(taxSeasonPayload.seasons[0]?.id, "2026");
  assert.equal(taxSeasonPayload.seasons[0]?.status, "active");
  assert.deepEqual(
    taxSeasonPayload.seasons[0]?.projects,
    registrySeasons[0]?.projects,
  );
  assert.equal(
    taxSeasonPayload.seasons.some((season) => season.id === "2027"),
    false,
  );

  for (const path of migratedReaders) {
    const source = readFileSync(path, "utf8");

    assert.ok(
      source.includes("operational-tax-season-configuration"),
      `${path} must use the operational configuration service.`,
    );
    assert.ok(
      !source.includes("tax-pipeline/tax-seasons"),
      `${path} must not import the code-backed registry directly.`,
    );

    for (const forbiddenDependency of [
      "@/lib/db",
      "drizzle-orm",
      "DATABASE_URL",
      "tax-season-repository",
    ]) {
      assert.ok(
        !source.includes(forbiddenDependency),
        `${path} introduced a forbidden operational database dependency.`,
      );
    }
  }

  const asanaApiSource = readFileSync("src/app/api/asana/route.ts", "utf8");
  for (const preservedResponseField of [
    "taxReturns",
    "nonTaxRecords",
    "unmappedRecords",
    "selectedSectionGid",
    "clientStatusEligible",
    "exclusionReason",
  ]) {
    assert.ok(asanaApiSource.includes(preservedResponseField));
  }

  const executiveSource = readFileSync(
    "src/features/executive/executive.service.ts",
    "utf8",
  );
  for (const preservedMetric of [
    "totalAsanaRecords",
    "totalTaxReturns",
    "stages",
    "workflows",
    "projects",
  ]) {
    assert.ok(executiveSource.includes(preservedMetric));
  }

  const previewSource = readFileSync(
    "src/app/tax-returns/[gid]/page.tsx",
    "utf8",
  );
  assert.ok(previewSource.includes("if (!classification.clientStatusEligible)"));
  assert.ok(previewSource.includes("notFound()"));
  assert.ok(previewSource.includes("getReportPreviewBackNavigation"));

  const projectDiscoverySource = readFileSync(
    "src/app/api/asana/projects/route.ts",
    "utf8",
  );
  assert.ok(projectDiscoverySource.includes("buildProjectAssignmentMap(seasons)"));
  assert.ok(projectDiscoverySource.includes("assignments"));

  for (const clientPath of [
    "src/app/page.tsx",
    "src/app/tax-returns/page.tsx",
    "src/app/status-reports/page.tsx",
  ]) {
    assert.ok(readFileSync(clientPath, "utf8").includes('"2026"'));
  }

  const classifierSource = readFileSync(
    "src/features/tax-pipeline/classify-tax-return.ts",
    "utf8",
  );
  assert.ok(!classifierSource.includes("operational-tax-season-configuration"));

  console.log("Async operational Tax Season reader verification passed.");
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Async operational reader verification failed.",
  );
  process.exitCode = 1;
});
