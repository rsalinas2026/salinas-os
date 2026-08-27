import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveClientTaxSeason } from "../src/features/tax-pipeline/client-season-resolution";

const availableSeasonIds = ["2027", "2026"];

assert.deepEqual(
  resolveClientTaxSeason({
    requestedSeasonId: "2027",
    activeSeasonId: "2026",
    availableSeasonIds,
  }),
  { success: true, seasonId: "2027", source: "url" },
);
assert.deepEqual(
  resolveClientTaxSeason({
    requestedSeasonId: null,
    activeSeasonId: "2026",
    availableSeasonIds,
  }),
  { success: true, seasonId: "2026", source: "current" },
);
assert.deepEqual(
  resolveClientTaxSeason({
    requestedSeasonId: "unknown",
    activeSeasonId: "2026",
    availableSeasonIds,
  }),
  { success: false, error: "Unknown Tax Season: unknown" },
);
assert.deepEqual(
  resolveClientTaxSeason({
    activeSeasonId: "",
    availableSeasonIds,
  }),
  {
    success: false,
    error: "No current/default Tax Season is available.",
  },
);

for (const pagePath of [
  "src/app/page.tsx",
  "src/app/tax-returns/page.tsx",
  "src/app/status-reports/page.tsx",
]) {
  const source = readFileSync(pagePath, "utf8");
  assert.ok(!/get\(["']season["']\).*\|\|\s*["']2026["']/.test(source));
  assert.ok(!/get\(["']season["']\).*\?\?\s*["']2026["']/.test(source));
  assert.ok(source.includes("requestedSeasonId"));
  assert.ok(source.includes("resolvedSeasonId"));
  assert.ok(source.includes("if (!selectedSeasonId)"));
}

const selectorSource = readFileSync("src/components/SeasonSelector.tsx", "utf8");
assert.ok(selectorSource.includes('fetch("/api/tax-seasons"'));
assert.ok(selectorSource.includes("resolveClientTaxSeason"));
assert.ok(selectorSource.includes("onSeasonResolved"));
assert.ok(selectorSource.includes("onSeasonResolutionError"));

const statusReportsSource = readFileSync(
  "src/app/status-reports/page.tsx",
  "utf8",
);
for (const preservedNavigation of [
  "buildStatusReportsUrl",
  "buildReportPreviewUrl",
  "readinessFilter",
  "stageFilter",
  "reportReadinessFilter",
]) {
  assert.ok(statusReportsSource.includes(preservedNavigation));
}

console.log("Client default-season verification passed.");
