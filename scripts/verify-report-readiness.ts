import assert from "node:assert/strict";
import { evaluateReportReadiness } from "../src/features/status-reports/report-readiness";
import type { TaxReturnClassification } from "../src/features/tax-pipeline/classify-tax-return";

function eligibleClassification(
  overrides: Partial<TaxReturnClassification> = {},
): TaxReturnClassification {
  return {
    selectedProjectGid: "project-2026",
    selectedProjectName: "2026 Tax Season",
    selectedSectionGid: "section-preparation",
    selectedSectionName: "XIOMY TAXES",
    taxReturnEligible: true,
    clientVisible: true,
    clientStage: "Tax Preparation",
    progressPercent: 60,
    workflowType: "unknown",
    mappingStatus: "mapped",
    exclusionReason: null,
    belongsToSelectedSeason: true,
    clientStatusEligible: true,
    ...overrides,
  };
}

const blocked = evaluateReportReadiness({
  classification: eligibleClassification({
    clientStatusEligible: false,
    exclusionReason: "unmapped-section",
    mappingStatus: "unmapped",
  }),
  task: { assignee: { gid: "staff-1", name: "RCBS Staff" } },
});
assert.equal(blocked.category, null);
assert.equal(blocked.weeklyReportCandidate, false);
assert.equal(blocked.decisionCode, "canonical-blocked");

const candidateInput = {
  classification: eligibleClassification(),
  task: { assignee: { gid: "staff-1", name: "RCBS Staff" } },
} as const;
const candidate = evaluateReportReadiness(candidateInput);
assert.equal(candidate.category, "candidate");
assert.equal(candidate.weeklyReportCandidate, true);
assert.ok(candidate.explanation.length > 0);
assert.deepEqual(evaluateReportReadiness(candidateInput), candidate);

const unassigned = evaluateReportReadiness({
  classification: eligibleClassification(),
  task: { assignee: null },
});
assert.equal(unassigned.category, "attention-required");
assert.equal(unassigned.decisionCode, "missing-assignee");
assert.ok(unassigned.explanation.length > 0);

const completedBeforeFiled = evaluateReportReadiness({
  classification: eligibleClassification(),
  task: {
    completed: true,
    assignee: { gid: "staff-1", name: "RCBS Staff" },
  },
});
assert.equal(completedBeforeFiled.category, "attention-required");
assert.equal(completedBeforeFiled.decisionCode, "completed-state-review");

const filed = evaluateReportReadiness({
  classification: eligibleClassification({
    clientStage: "Filed",
    progressPercent: 95,
  }),
  task: {
    completed: true,
    assignee: { gid: "staff-1", name: "RCBS Staff" },
  },
});
assert.equal(filed.category, "not-applicable");
assert.equal(filed.weeklyReportCandidate, false);
assert.equal(filed.businessPolicyRequired, false);
assert.equal(filed.decisionCode, "filed-recurring-not-applicable");
assert.ok(filed.explanation.includes("recurring weekly reporting"));

const completeProgress = evaluateReportReadiness({
  classification: eligibleClassification({ progressPercent: 100 }),
  task: { assignee: { gid: "staff-1", name: "RCBS Staff" } },
});
assert.equal(completeProgress.category, "not-applicable");
assert.equal(completeProgress.weeklyReportCandidate, false);
assert.equal(completeProgress.businessPolicyRequired, false);
assert.equal(
  completeProgress.decisionCode,
  "filed-recurring-not-applicable",
);

console.log("Report Readiness verification passed.");
