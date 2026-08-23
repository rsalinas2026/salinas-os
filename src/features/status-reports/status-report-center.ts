import type { TaxReturnExclusionReason } from "../tax-pipeline/classify-tax-return";

export type StatusReportFilter = "all" | "ready" | "blocked";

export interface StatusReportRecord {
  gid: string;
  name: string;
  clientStage: string;
  progressPercent: number;
  sourceProject: {
    gid: string;
    name: string | null;
  } | null;
  clientStatusEligible: boolean;
  exclusionReason: TaxReturnExclusionReason | null;
}

export interface StatusReportFilters {
  search: string;
  readiness: StatusReportFilter;
  stage: string;
}

const EXCLUSION_REASON_LABELS: Record<
  TaxReturnExclusionReason,
  string
> = {
  "outside-selected-season": "Outside selected Tax Season",
  "missing-section": "No workflow section assigned",
  "unmapped-section": "Workflow section is not mapped",
  "non-tax-record": "Not classified as a tax return",
  "client-invisible": "Not approved for client-facing status",
};

export function getStatusReportCategory(
  record: StatusReportRecord,
): Exclude<StatusReportFilter, "all"> {
  return record.clientStatusEligible ? "ready" : "blocked";
}

export function getStatusReportBlockLabel(
  record: StatusReportRecord,
): string | null {
  if (record.clientStatusEligible) {
    return null;
  }

  if (!record.exclusionReason) {
    return "Canonical classification is unavailable";
  }

  return EXCLUSION_REASON_LABELS[record.exclusionReason];
}

export function filterStatusReportRecords(
  records: StatusReportRecord[],
  filters: StatusReportFilters,
): StatusReportRecord[] {
  const query = filters.search.trim().toLowerCase();

  return records.filter((record) => {
    const category = getStatusReportCategory(record);
    const blockLabel = getStatusReportBlockLabel(record) ?? "";
    const projectName = record.sourceProject?.name ?? "";

    const matchesSearch =
      !query ||
      record.name.toLowerCase().includes(query) ||
      record.clientStage.toLowerCase().includes(query) ||
      projectName.toLowerCase().includes(query) ||
      blockLabel.toLowerCase().includes(query);

    const matchesReadiness =
      filters.readiness === "all" ||
      category === filters.readiness;

    const matchesStage =
      filters.stage === "all" ||
      record.clientStage === filters.stage;

    return matchesSearch && matchesReadiness && matchesStage;
  });
}
