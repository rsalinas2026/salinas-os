import assert from "node:assert/strict";
import {
  filterStatusReportRecords,
  getReportReadinessCounts,
  getStatusReportBlockLabel,
  getStatusReportCategory,
  type StatusReportRecord,
} from "../src/features/status-reports/status-report-center";
import {
  buildReportPreviewUrl,
  buildStatusReportsUrl,
  getReportPreviewBackNavigation,
} from "../src/features/status-reports/status-report-navigation";

const records: StatusReportRecord[] = [
  {
    gid: "ready-return",
    name: "Acme Client",
    clientStage: "Tax Preparation",
    progressPercent: 60,
    sourceProject: {
      gid: "project-2026",
      name: "2026 Tax Season",
    },
    clientStatusEligible: true,
    exclusionReason: null,
    reportReadiness: {
      category: "candidate",
      weeklyReportCandidate: true,
      explanation: "Active assigned return in the client-facing workflow.",
      decisionCode: "active-assigned-return",
      businessPolicyRequired: false,
    },
  },
  {
    gid: "blocked-return",
    name: "Blocked Client",
    clientStage: "Status Under Review",
    progressPercent: 0,
    sourceProject: {
      gid: "project-2026",
      name: "2026 Tax Season",
    },
    clientStatusEligible: false,
    exclusionReason: "unmapped-section",
    reportReadiness: {
      category: null,
      weeklyReportCandidate: false,
      explanation: "Canonical client-status eligibility is required.",
      decisionCode: "canonical-blocked",
      businessPolicyRequired: false,
    },
  },
  {
    gid: "filed-return",
    name: "Filed Client",
    clientStage: "Filed",
    progressPercent: 100,
    sourceProject: {
      gid: "project-2026",
      name: "2026 Tax Season",
    },
    clientStatusEligible: true,
    exclusionReason: null,
    reportReadiness: {
      category: "not-applicable",
      weeklyReportCandidate: false,
      explanation:
        "Return is filed / 100% complete — recurring weekly reporting is no longer applicable.",
      decisionCode: "filed-recurring-not-applicable",
      businessPolicyRequired: false,
    },
  },
];

assert.equal(getStatusReportCategory(records[0]), "ready");
assert.equal(getStatusReportCategory(records[1]), "blocked");
assert.equal(
  getStatusReportBlockLabel(records[1]),
  "Workflow section is not mapped",
);

assert.deepEqual(getReportReadinessCounts(records), {
  candidate: 1,
  "attention-required": 0,
  "not-applicable": 1,
});

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "",
    readiness: "ready",
    stage: "all",
    reportReadiness: "candidate",
  }).map((record) => record.gid),
  ["ready-return"],
);

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "",
    readiness: "all",
    stage: "all",
    reportReadiness: "attention-required",
  }),
  [],
);

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "",
    readiness: "ready",
    stage: "all",
    reportReadiness: "not-applicable",
  }).map((record) => record.gid),
  ["filed-return"],
);

assert.equal(
  buildStatusReportsUrl("2026", {
    readiness: "all",
    stage: "all",
    reportReadiness: "all",
    search: "",
  }),
  "/status-reports?season=2026",
);

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "",
    readiness: "all",
    stage: "all",
    reportReadiness: "all",
  }).map((record) => record.gid),
  ["ready-return", "blocked-return", "filed-return"],
);

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "Acme",
    readiness: "all",
    stage: "all",
    reportReadiness: "all",
  }).map((record) => record.gid),
  ["ready-return"],
);

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "",
    readiness: "ready",
    stage: "all",
    reportReadiness: "all",
  }).map((record) => record.gid),
  ["ready-return", "filed-return"],
);

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "",
    readiness: "blocked",
    stage: "all",
    reportReadiness: "all",
  }).map((record) => record.gid),
  ["blocked-return"],
);

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "",
    readiness: "all",
    stage: "Tax Preparation",
    reportReadiness: "all",
  }).map((record) => record.gid),
  ["ready-return"],
);

const statusPreviewUrl = buildReportPreviewUrl({
  taskGid: "ready-return",
  seasonId: "2026",
  source: "status-reports",
  statusState: {
    readiness: "blocked",
    stage: "Status Under Review",
    search: "Blocked Client",
    reportReadiness: "attention-required",
  },
});
assert.equal(
  statusPreviewUrl,
  "/tax-returns/ready-return?season=2026&source=status-reports&status=blocked&stage=Status+Under+Review&search=Blocked+Client&readiness=attention-required",
);

assert.deepEqual(
  getReportPreviewBackNavigation({
    source: "status-reports",
    seasonId: "2026",
    status: "blocked",
    stage: "Status Under Review",
    search: "Blocked Client",
    readiness: "attention-required",
  }),
  {
    href: "/status-reports?season=2026&status=blocked&stage=Status+Under+Review&search=Blocked+Client&readiness=attention-required",
    label: "Back to Weekly Status Reports",
  },
);

assert.deepEqual(
  getReportPreviewBackNavigation({
    source: "tax-returns",
    seasonId: "2026",
  }),
  {
    href: "/tax-returns?season=2026",
    label: "Back to Tax Returns",
  },
);

assert.deepEqual(
  getReportPreviewBackNavigation({
    source: "https://malicious.example",
    seasonId: "2026",
  }),
  {
    href: "/tax-returns?season=2026",
    label: "Back to Tax Returns",
  },
);

assert.deepEqual(
  getReportPreviewBackNavigation({ seasonId: "2026" }),
  {
    href: "/tax-returns?season=2026",
    label: "Back to Tax Returns",
  },
);

console.log("Weekly Status Report Center verification passed.");
