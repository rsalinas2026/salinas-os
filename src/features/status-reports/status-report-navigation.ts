import type { StatusReportFilter } from "./status-report-center";

export type ReportPreviewSource = "status-reports" | "tax-returns";

export interface StatusReportUrlState {
  readiness: StatusReportFilter;
  stage: string;
  search: string;
}

interface PreviewNavigationInput {
  source?: QueryValue;
  seasonId: string;
  status?: QueryValue;
  stage?: QueryValue;
  search?: QueryValue;
}

type QueryValue = string | string[] | null | undefined;

const MAX_FILTER_TEXT_LENGTH = 200;

function getFirstQueryValue(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}

export function parseStatusReportFilter(
  value: QueryValue,
): StatusReportFilter {
  const normalizedValue = getFirstQueryValue(value);

  if (normalizedValue === "ready" || normalizedValue === "blocked") {
    return normalizedValue;
  }

  return "all";
}

export function sanitizeStatusReportText(
  value: QueryValue,
): string {
  return (getFirstQueryValue(value) ?? "").slice(
    0,
    MAX_FILTER_TEXT_LENGTH,
  );
}

export function buildStatusReportsUrl(
  seasonId: string,
  state: StatusReportUrlState,
): string {
  const params = new URLSearchParams({ season: seasonId });

  if (state.readiness !== "all") {
    params.set("status", state.readiness);
  }

  if (state.stage !== "all" && state.stage) {
    params.set("stage", sanitizeStatusReportText(state.stage));
  }

  if (state.search) {
    params.set("search", sanitizeStatusReportText(state.search));
  }

  return `/status-reports?${params.toString()}`;
}

export function buildReportPreviewUrl({
  taskGid,
  seasonId,
  source,
  statusState,
}: {
  taskGid: string;
  seasonId: string;
  source: ReportPreviewSource;
  statusState?: StatusReportUrlState;
}): string {
  const params = new URLSearchParams({
    season: seasonId,
    source,
  });

  if (source === "status-reports" && statusState) {
    if (statusState.readiness !== "all") {
      params.set("status", statusState.readiness);
    }

    if (statusState.stage !== "all" && statusState.stage) {
      params.set("stage", sanitizeStatusReportText(statusState.stage));
    }

    if (statusState.search) {
      params.set("search", sanitizeStatusReportText(statusState.search));
    }
  }

  return `/tax-returns/${encodeURIComponent(taskGid)}?${params.toString()}`;
}

export function getReportPreviewBackNavigation(
  input: PreviewNavigationInput,
): { href: string; label: string } {
  if (getFirstQueryValue(input.source) === "status-reports") {
    return {
      href: buildStatusReportsUrl(input.seasonId, {
        readiness: parseStatusReportFilter(input.status),
        stage: sanitizeStatusReportText(input.stage) || "all",
        search: sanitizeStatusReportText(input.search),
      }),
      label: "Back to Weekly Status Reports",
    };
  }

  return {
    href: `/tax-returns?season=${encodeURIComponent(input.seasonId)}`,
    label: "Back to Tax Returns",
  };
}
