import assert from "node:assert/strict";
import { getDatabasePool } from "../src/lib/db/client";
import type { PersistentTaxSeasonConfiguration } from "../src/lib/db/tax-season-repository";
import {
  createPostgresTaxSeasonConfigurationProvider,
  OperationalTaxSeasonConfigurationError,
  postgresTaxSeasonConfigurationProvider,
} from "../src/features/tax-pipeline/configuration/postgres-tax-season-configuration-provider";
import { requireLocalSalinasDatabase } from "./require-local-database";

requireLocalSalinasDatabase();

const validatedAt = new Date("2026-01-01T00:00:00.000Z");

function persistentSeason(
  overrides: Partial<PersistentTaxSeasonConfiguration> = {},
): PersistentTaxSeasonConfiguration {
  return {
    id: "season-2026",
    code: "2026",
    year: 2026,
    name: "2026 Tax Season",
    status: "active",
    isDefault: true,
    projects: [
      {
        id: "project-2026",
        asanaProjectGid: "200",
        asanaProjectName: "2026 TAX SEASON",
        enabled: true,
        priority: 0,
        validatedAt,
      },
    ],
    ...overrides,
  };
}

function providerFor(seasons: PersistentTaxSeasonConfiguration[]) {
  return createPostgresTaxSeasonConfigurationProvider({
    async listSeasons() {
      return seasons;
    },
  });
}

async function expectConfigurationError(
  seasons: PersistentTaxSeasonConfiguration[],
) {
  await assert.rejects(
    providerFor(seasons).listSeasons(),
    OperationalTaxSeasonConfigurationError,
  );
}

async function main() {
  try {
    const [seasons, currentSeason, season2026, season2027, unknownSeason] =
      await Promise.all([
        postgresTaxSeasonConfigurationProvider.listSeasons(),
        postgresTaxSeasonConfigurationProvider.getCurrentSeason(),
        postgresTaxSeasonConfigurationProvider.getSeasonByCode("2026"),
        postgresTaxSeasonConfigurationProvider.getSeasonByCode("2027"),
        postgresTaxSeasonConfigurationProvider.getSeasonByCode("unknown"),
      ]);

    assert.equal(seasons.length, 2);
    assert.equal(currentSeason.id, "2026");
    assert.equal(currentSeason.status, "active");
    assert.equal(season2026?.id, "2026");
    assert.equal(season2026?.projects.length, 1);
    assert.equal(season2027?.id, "2027");
    assert.equal(season2027?.year, 2027);
    assert.equal(season2027?.name, "2027 Tax Season");
    assert.equal(season2027?.status, "planned");
    assert.equal(season2027?.projects.length, 1);
    assert.equal(season2027?.projects[0]?.asanaProjectGid, "1214909687451352");
    assert.equal(season2027?.projects[0]?.name, "2027 TAX SEASON");
    assert.equal(season2027?.projects[0]?.enabled, true);
    assert.equal(unknownSeason, null);

    const orderedProvider = providerFor([
      persistentSeason({
        projects: [
          {
            id: "project-b",
            asanaProjectGid: "200",
            asanaProjectName: "Second fallback",
            enabled: true,
            priority: 1,
            validatedAt,
          },
          {
            id: "project-first",
            asanaProjectGid: "300",
            asanaProjectName: "First priority",
            enabled: true,
            priority: 0,
            validatedAt,
          },
          {
            id: "project-a",
            asanaProjectGid: "100",
            asanaProjectName: "First fallback",
            enabled: true,
            priority: 1,
            validatedAt,
          },
        ],
      }),
    ]);
    const [orderedSeason] = await orderedProvider.listSeasons();
    assert.deepEqual(
      orderedSeason.projects.map((project) => project.asanaProjectGid),
      ["300", "100", "200"],
    );

    await expectConfigurationError([]);
    await expectConfigurationError([
      persistentSeason({ status: "upcoming", isDefault: true }),
    ]);
    await expectConfigurationError([
      persistentSeason(),
      persistentSeason({
        id: "season-2027",
        code: "2027",
        year: 2027,
        status: "active",
        isDefault: false,
      }),
    ]);
    await expectConfigurationError([
      persistentSeason({ isDefault: false }),
    ]);
    await expectConfigurationError([
      persistentSeason(),
      persistentSeason({
        id: "season-2027",
        code: "2027",
        year: 2027,
        status: "upcoming",
        isDefault: true,
        projects: [
          {
            id: "project-2027",
            asanaProjectGid: "201",
            asanaProjectName: "2027 TAX SEASON",
            enabled: true,
            priority: 0,
            validatedAt,
          },
        ],
      }),
    ]);
    await expectConfigurationError([
      persistentSeason({ status: "archived", isDefault: true }),
    ]);
    await expectConfigurationError([
      persistentSeason({
        projects: [
          {
            id: "disabled-project",
            asanaProjectGid: "200",
            asanaProjectName: "Disabled",
            enabled: false,
            priority: 0,
            validatedAt,
          },
        ],
      }),
    ]);
    await expectConfigurationError([
      persistentSeason({
        projects: [
          {
            id: "empty-gid",
            asanaProjectGid: " ",
            asanaProjectName: "Missing GID",
            enabled: true,
            priority: 0,
            validatedAt,
          },
        ],
      }),
    ]);
    await expectConfigurationError([
      persistentSeason({
        projects: [
          {
            id: "invalid-validation",
            asanaProjectGid: "200",
            asanaProjectName: "Invalid validation",
            enabled: true,
            priority: 0,
            validatedAt: new Date(Number.NaN),
          },
        ],
      }),
    ]);
    await expectConfigurationError([
      persistentSeason({
        projects: [
          {
            id: "duplicate-a",
            asanaProjectGid: "200",
            asanaProjectName: "Duplicate A",
            enabled: true,
            priority: 0,
            validatedAt,
          },
          {
            id: "duplicate-b",
            asanaProjectGid: "200",
            asanaProjectName: "Duplicate B",
            enabled: true,
            priority: 1,
            validatedAt,
          },
        ],
      }),
    ]);

    console.log("PostgreSQL Tax Season provider verification passed.");
  } finally {
    await getDatabasePool().end();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "PostgreSQL Tax Season provider verification failed.",
  );
  process.exitCode = 1;
});
