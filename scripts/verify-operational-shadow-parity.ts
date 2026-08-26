import assert from "node:assert/strict";
import { evaluateReportReadiness } from "../src/features/status-reports/report-readiness";
import { getReportReadinessCounts } from "../src/features/status-reports/status-report-center";
import { classifyTaxReturnTask } from "../src/features/tax-pipeline/classify-tax-return";
import type { TaxSeason } from "../src/features/tax-pipeline/tax-season-domain";
import type { AsanaTask } from "../src/features/tax-pipeline/tax-pipeline.service";
import { requireLocalSalinasDatabase } from "./require-local-database";

requireLocalSalinasDatabase();

function comparableSeason(season: TaxSeason) {
  return {
    id: season.id,
    year: season.year,
    name: season.name,
    status: season.status,
    projects: season.projects.map((project) => ({
      name: project.name,
      asanaProjectGid: project.asanaProjectGid,
      enabled: project.enabled,
    })),
  };
}

function reportingCounts(
  tasks: AsanaTask[],
  season: TaxSeason,
) {
  const records = tasks.map((task) => {
    const classification = classifyTaxReturnTask(task, season);

    return {
      gid: task.gid,
      name: task.name,
      clientStage: classification.clientStage,
      progressPercent: classification.progressPercent,
      sourceProject: classification.selectedProjectGid
        ? {
            gid: classification.selectedProjectGid,
            name: classification.selectedProjectName,
          }
        : null,
      clientStatusEligible: classification.clientStatusEligible,
      exclusionReason: classification.exclusionReason,
      reportReadiness: evaluateReportReadiness({ classification, task }),
    };
  });

  return {
    ready: records.filter((record) => record.clientStatusEligible).length,
    blocked: records.filter((record) => !record.clientStatusEligible).length,
    ...getReportReadinessCounts(records),
  };
}

async function main() {
  const [
    { buildExecutiveDashboardFromCollection },
    { codeTaxSeasonConfigurationProvider },
    { postgresTaxSeasonConfigurationProvider },
    { listOperationalTaxSeasons },
    { getTaxSeasonTasks },
    { getDatabasePool },
  ] = await Promise.all([
    import("../src/features/executive/executive.service"),
    import(
      "../src/features/tax-pipeline/configuration/code-tax-season-configuration-provider"
    ),
    import(
      "../src/features/tax-pipeline/configuration/postgres-tax-season-configuration-provider"
    ),
    import(
      "../src/features/tax-pipeline/configuration/operational-tax-season-configuration"
    ),
    import("../src/features/tax-pipeline/tax-pipeline.service"),
    import("../src/lib/db/client"),
  ]);

  try {
    const [codeSeasons, postgresSeasons, codeCurrent, postgresCurrent] =
      await Promise.all([
        codeTaxSeasonConfigurationProvider.listSeasons(),
        postgresTaxSeasonConfigurationProvider.listSeasons(),
        codeTaxSeasonConfigurationProvider.getCurrentSeason(),
        postgresTaxSeasonConfigurationProvider.getCurrentSeason(),
      ]);

    const postgres2026 = postgresSeasons.find((season) => season.id === "2026");
    const postgres2027 = postgresSeasons.find((season) => season.id === "2027");

    assert.ok(postgres2026);
    assert.ok(postgres2027);
    assert.deepEqual(comparableSeason(postgres2026), comparableSeason(codeSeasons[0]));
    assert.deepEqual(comparableSeason(postgresCurrent), comparableSeason(codeCurrent));
    assert.equal(
      await codeTaxSeasonConfigurationProvider.getSeasonByCode("unknown"),
      null,
    );
    assert.equal(
      await postgresTaxSeasonConfigurationProvider.getSeasonByCode("unknown"),
      null,
    );
    assert.equal(postgres2027.status, "planned");
    assert.equal(postgres2027.projects[0]?.asanaProjectGid, "1214909687451352");
    assert.equal(postgres2027.projects[0]?.name, "2027 TAX SEASON");
    assert.equal(postgres2027.projects[0]?.enabled, true);

    const runtimeSeasons = await listOperationalTaxSeasons();
    assert.deepEqual(runtimeSeasons, codeSeasons);
    assert.equal(runtimeSeasons.length, 1);
    assert.equal(runtimeSeasons.some((season) => season.id === "2027"), false);

    const codeCollection = await getTaxSeasonTasks(codeCurrent);
    const postgresCollection = {
      season: postgres2026,
      projects: postgres2026.projects,
      tasks: codeCollection.tasks,
    };

    const codeClassifications = new Map(
      codeCollection.tasks.map((task) => [
        task.gid,
        classifyTaxReturnTask(task, codeCurrent),
      ]),
    );
    const postgresClassifications = new Map(
      codeCollection.tasks.map((task) => [
        task.gid,
        classifyTaxReturnTask(task, postgres2026),
      ]),
    );

    assert.equal(postgresCollection.tasks.length, codeCollection.tasks.length);
    assert.equal(codeClassifications.size, postgresClassifications.size);

    for (const [taskGid, codeClassification] of codeClassifications) {
      assert.deepEqual(postgresClassifications.get(taskGid), codeClassification);
    }

    const now = new Date();
    const codeExecutive = buildExecutiveDashboardFromCollection(
      codeCollection,
      now,
    );
    const postgresExecutive = buildExecutiveDashboardFromCollection(
      postgresCollection,
      now,
    );
    assert.deepEqual(postgresExecutive, codeExecutive);

    const codeReporting = reportingCounts(codeCollection.tasks, codeCurrent);
    const postgresReporting = reportingCounts(
      postgresCollection.tasks,
      postgres2026,
    );
    assert.deepEqual(postgresReporting, codeReporting);

    console.log(
      JSON.stringify({
        taskCount: codeCollection.tasks.length,
        eligibleTaxReturns: [...codeClassifications.values()].filter(
          (classification) => classification.taxReturnEligible,
        ).length,
        pipeline: codeExecutive.pipeline,
        stages: codeExecutive.stages,
        workflows: codeExecutive.workflows,
        projects: codeExecutive.projects,
        weeklyStatusReports: codeReporting,
      }),
    );
    console.log("Operational PostgreSQL shadow parity verification passed.");
  } finally {
    await getDatabasePool().end();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Operational shadow parity verification failed.",
  );
  process.exitCode = 1;
});
