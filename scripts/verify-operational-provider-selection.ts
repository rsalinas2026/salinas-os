import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { requireLocalSalinasDatabase } from "./require-local-database";

requireLocalSalinasDatabase();

const LOCAL_DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const [
    { codeTaxSeasonConfigurationProvider },
    { postgresTaxSeasonConfigurationProvider },
    {
      getOperationalTaxSeasonProviderName,
      OperationalTaxSeasonProviderSelectionError,
      selectOperationalTaxSeasonProvider,
    },
    operationalService,
    { GET: getTaxSeasonsResponse },
    { GET: getAsanaTaxSeasonResponse },
    { NextRequest },
    { getDatabasePool },
  ] = await Promise.all([
    import(
      "../src/features/tax-pipeline/configuration/code-tax-season-configuration-provider"
    ),
    import(
      "../src/features/tax-pipeline/configuration/postgres-tax-season-configuration-provider"
    ),
    import(
      "../src/features/tax-pipeline/configuration/operational-tax-season-provider-selection"
    ),
    import(
      "../src/features/tax-pipeline/configuration/operational-tax-season-configuration"
    ),
    import("../src/app/api/tax-seasons/route"),
    import("../src/app/api/asana/route"),
    import("next/server"),
    import("../src/lib/db/client"),
  ]);

  const originalProvider = process.env.SALINAS_TAX_SEASON_PROVIDER;
  const originalProductionGuard =
    process.env.SALINAS_ENABLE_PRODUCTION_DATABASE_TAX_SEASONS;

  try {
    assert.equal(getOperationalTaxSeasonProviderName({}), "code");
    assert.equal(
      getOperationalTaxSeasonProviderName({
        SALINAS_TAX_SEASON_PROVIDER: "code",
      }),
      "code",
    );
    assert.equal(
      selectOperationalTaxSeasonProvider({
        SALINAS_TAX_SEASON_PROVIDER: "code",
      }),
      codeTaxSeasonConfigurationProvider,
    );
    assert.equal(
      selectOperationalTaxSeasonProvider({
        SALINAS_TAX_SEASON_PROVIDER: "database",
        DATABASE_URL: LOCAL_DATABASE_URL,
        NODE_ENV: "development",
      }),
      postgresTaxSeasonConfigurationProvider,
    );

    assert.throws(
      () =>
        getOperationalTaxSeasonProviderName({
          SALINAS_TAX_SEASON_PROVIDER: "invalid",
        }),
      OperationalTaxSeasonProviderSelectionError,
    );
    assert.throws(
      () =>
        selectOperationalTaxSeasonProvider({
          SALINAS_TAX_SEASON_PROVIDER: "database",
          NODE_ENV: "development",
        }),
      /DATABASE_URL is required/,
    );
    assert.throws(
      () =>
        selectOperationalTaxSeasonProvider({
          SALINAS_TAX_SEASON_PROVIDER: "database",
          DATABASE_URL: LOCAL_DATABASE_URL,
          NODE_ENV: "production",
        }),
      OperationalTaxSeasonProviderSelectionError,
    );
    assert.equal(
      selectOperationalTaxSeasonProvider({
        SALINAS_TAX_SEASON_PROVIDER: "database",
        SALINAS_ENABLE_PRODUCTION_DATABASE_TAX_SEASONS: "true",
        DATABASE_URL: LOCAL_DATABASE_URL,
        NODE_ENV: "production",
      }),
      postgresTaxSeasonConfigurationProvider,
    );

    process.env.SALINAS_TAX_SEASON_PROVIDER = "database";
    delete process.env.SALINAS_ENABLE_PRODUCTION_DATABASE_TAX_SEASONS;

    const [seasons, currentSeason, season2027] = await Promise.all([
      operationalService.listOperationalTaxSeasons(),
      operationalService.getCurrentOperationalTaxSeason(),
      operationalService.resolveOperationalTaxSeason("2027"),
    ]);

    assert.deepEqual(
      seasons.map((season) => season.id),
      ["2027", "2026"],
    );
    assert.equal(currentSeason.id, "2026");
    assert.equal(currentSeason.status, "active");
    assert.equal(season2027.id, "2027");
    assert.equal(season2027.year, 2027);
    assert.equal(season2027.status, "planned");
    assert.equal(season2027.projects[0]?.asanaProjectGid, "1214909687451352");
    assert.equal(season2027.projects[0]?.name, "2027 TAX SEASON");
    assert.equal(season2027.projects[0]?.enabled, true);
    await assert.rejects(
      operationalService.resolveOperationalTaxSeason("unknown"),
      /Unknown tax season: unknown/,
    );

    const response = await getTaxSeasonsResponse();
    const payload = (await response.json()) as {
      success: boolean;
      activeSeasonId: string;
      seasons: Array<{ id: string; status: string }>;
    };
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.activeSeasonId, "2026");
    assert.deepEqual(
      payload.seasons.map((season) => [season.id, season.status]),
      [
        ["2027", "planned"],
        ["2026", "active"],
      ],
    );

    const asanaResponse = await getAsanaTaxSeasonResponse(
      new NextRequest("http://localhost/api/asana?season=2027"),
    );
    const asanaPayload = (await asanaResponse.json()) as {
      success: boolean;
      season?: { id: string; status: string };
      projects?: Array<{ asanaProjectGid: string }>;
    };
    assert.equal(asanaResponse.status, 200);
    assert.equal(asanaPayload.success, true);
    assert.equal(asanaPayload.season?.id, "2027");
    assert.equal(asanaPayload.season?.status, "planned");
    assert.deepEqual(
      asanaPayload.projects?.map((project) => project.asanaProjectGid),
      ["1214909687451352"],
    );

    const migratedReaders = [
      "src/app/api/tax-seasons/route.ts",
      "src/app/api/asana/route.ts",
      "src/features/executive/executive.service.ts",
      "src/app/tax-returns/[gid]/page.tsx",
      "src/features/tax-pipeline/tax-pipeline.service.ts",
      "src/app/api/asana/projects/route.ts",
    ];

    for (const path of migratedReaders) {
      const source = readFileSync(path, "utf8");
      assert.ok(source.includes("operational-tax-season-configuration"));
      assert.ok(!source.includes("configuration-provider"));
      assert.ok(!source.includes("DATABASE_URL"));
    }

    for (const clientPath of [
      "src/app/page.tsx",
      "src/app/tax-returns/page.tsx",
      "src/app/status-reports/page.tsx",
      "src/components/SeasonSelector.tsx",
    ]) {
      const source = readFileSync(clientPath, "utf8");
      assert.ok(!source.includes("SALINAS_TAX_SEASON_PROVIDER"));
      assert.ok(!source.includes("DATABASE_URL"));
    }

    console.log("Operational provider-selection verification passed.");
  } finally {
    if (originalProvider === undefined) {
      delete process.env.SALINAS_TAX_SEASON_PROVIDER;
    } else {
      process.env.SALINAS_TAX_SEASON_PROVIDER = originalProvider;
    }

    if (originalProductionGuard === undefined) {
      delete process.env.SALINAS_ENABLE_PRODUCTION_DATABASE_TAX_SEASONS;
    } else {
      process.env.SALINAS_ENABLE_PRODUCTION_DATABASE_TAX_SEASONS =
        originalProductionGuard;
    }

    await getDatabasePool().end();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Operational provider-selection verification failed.",
  );
  process.exitCode = 1;
});
