import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AsanaApiError } from "../src/lib/asana/asana-client";
import { getReportPreviewAsanaErrorDisposition } from "../src/features/client-portal/report-preview-asana-error";
import { classifyTaxReturnTask } from "../src/features/tax-pipeline/classify-tax-return";
import { SECTION_PROGRESS_MAPPINGS } from "../src/features/tax-pipeline/progress/section-mapping";
import type { TaxSeason } from "../src/features/tax-pipeline/tax-season-domain";

for (const status of [403, 404]) {
  assert.equal(
    getReportPreviewAsanaErrorDisposition(new AsanaApiError(status)),
    "not-found",
  );
}
assert.equal(
  getReportPreviewAsanaErrorDisposition(new AsanaApiError(401)),
  "operational-authentication",
);
for (const status of [429, 500, 502, 503]) {
  assert.equal(
    getReportPreviewAsanaErrorDisposition(new AsanaApiError(status)),
    "temporarily-unavailable",
  );
}
assert.equal(
  getReportPreviewAsanaErrorDisposition(new AsanaApiError(400)),
  "unexpected",
);
assert.equal(
  getReportPreviewAsanaErrorDisposition(new Error("unrelated")),
  "unexpected",
);

const season: TaxSeason = {
  id: "verification",
  year: 2027,
  name: "Verification Season",
  status: "active",
  projects: [
    {
      id: "configured-project",
      name: "Configured Project",
      asanaProjectGid: "configured-project",
      enabled: true,
    },
  ],
};

function classification(projectGid: string, sectionName?: string) {
  return classifyTaxReturnTask(
    {
      memberships: [
        {
          project: { gid: projectGid, name: projectGid },
          section: sectionName
            ? { gid: `section-${sectionName}`, name: sectionName }
            : null,
        },
      ],
    },
    season,
  );
}

const eligible = classification("configured-project", "1.0 PRESCREENING");
assert.equal(eligible.clientStatusEligible, true);
assert.equal(eligible.clientStage, "Initial Review");
assert.equal(eligible.progressPercent, 10);

const outsideSeason = classification("different-project", "1.0 PRESCREENING");
assert.equal(outsideSeason.clientStatusEligible, false);
assert.equal(outsideSeason.exclusionReason, "outside-selected-season");

const missingSection = classification("configured-project");
assert.equal(missingSection.clientStatusEligible, false);
assert.equal(missingSection.exclusionReason, "missing-section");

const unmapped = classification("configured-project", "UNKNOWN SECTION");
assert.equal(unmapped.clientStatusEligible, false);
assert.equal(unmapped.exclusionReason, "unmapped-section");

const nonTax = classification("configured-project", "QUESTIONNARIES");
assert.equal(nonTax.clientStatusEligible, false);
assert.equal(nonTax.exclusionReason, "non-tax-record");

assert.equal(
  Object.values(SECTION_PROGRESS_MAPPINGS).filter(
    (mapping) => mapping.isTaxReturn && !mapping.clientVisible,
  ).length,
  0,
  "Add a client-invisible tax mapping scenario if one is introduced.",
);

const pageSource = readFileSync("src/app/tax-returns/[gid]/page.tsx", "utf8");
assert.ok(pageSource.includes("getReportPreviewAsanaErrorDisposition"));
assert.ok(pageSource.includes('disposition === "not-found"'));
assert.ok(pageSource.includes("notFound()"));
assert.ok(pageSource.includes("getReportPreviewBackNavigation"));
assert.ok(pageSource.includes("if (!classification.clientStatusEligible)"));
assert.ok(!pageSource.includes("error.message"));
assert.ok(!pageSource.includes("error.status"));

console.log("Report preview error-handling verification passed.");
