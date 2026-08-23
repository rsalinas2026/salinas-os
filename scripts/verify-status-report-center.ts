import assert from "node:assert/strict";
import {
  filterStatusReportRecords,
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
  },
];

assert.equal(getStatusReportCategory(records[0]), "ready");
assert.equal(getStatusReportCategory(records[1]), "blocked");
assert.equal(
  getStatusReportBlockLabel(records[1]),
  "Workflow section is not mapped",
);

assert.equal(
  buildStatusReportsUrl("2026", {
    readiness: "all",
    stage: "all",
    search: "",
  }),
  "/status-reports?season=2026",
);

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "",
    readiness: "all",
    stage: "all",
  }).map((record) => record.gid),
  ["ready-return", "blocked-return"],
);

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "Acme",
    readiness: "all",
    stage: "all",
  }).map((record) => record.gid),
  ["ready-return"],
);

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "",
    readiness: "ready",
    stage: "all",
  }).map((record) => record.gid),
  ["ready-return"],
);

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "",
    readiness: "blocked",
    stage: "all",
  }).map((record) => record.gid),
  ["blocked-return"],
);

assert.deepEqual(
  filterStatusReportRecords(records, {
    search: "",
    readiness: "all",
    stage: "Tax Preparation",
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
  },
});
assert.equal(
  statusPreviewUrl,
  "/tax-returns/ready-return?season=2026&source=status-reports&status=blocked&stage=Status+Under+Review&search=Blocked+Client",
);

assert.deepEqual(
  getReportPreviewBackNavigation({
    source: "status-reports",
    seasonId: "2026",
    status: "blocked",
    stage: "Status Under Review",
    search: "Blocked Client",
  }),
  {
    href: "/status-reports?season=2026&status=blocked&stage=Status+Under+Review&search=Blocked+Client",
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
