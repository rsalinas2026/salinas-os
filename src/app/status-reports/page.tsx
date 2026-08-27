"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import SeasonSelector from "@/components/SeasonSelector";
import {
  filterStatusReportRecords,
  getReportReadinessCounts,
  getStatusReportBlockLabel,
  getStatusReportCategory,
  type ReportReadinessFilter,
  type StatusReportFilter,
  type StatusReportRecord,
} from "@/features/status-reports/status-report-center";
import {
  buildReportPreviewUrl,
  buildStatusReportsUrl,
  parseReportReadinessFilter,
  parseStatusReportFilter,
  sanitizeStatusReportText,
} from "@/features/status-reports/status-report-navigation";

interface StatusReportsApiResponse {
  success?: boolean;
  tasks?: StatusReportRecord[];
  error?: string;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function StatusReportsLoadingFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="font-semibold text-slate-700">
          Preparing Weekly Status Reports...
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Loading canonical report eligibility from Asana.
        </p>
      </div>
    </main>
  );
}

function WeeklyStatusReportCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSeasonId = searchParams.get("season")?.trim() ?? "";
  const [resolvedSeasonId, setResolvedSeasonId] = useState("");
  const selectedSeasonId =
    resolvedSeasonId &&
    (!requestedSeasonId || resolvedSeasonId === requestedSeasonId)
      ? resolvedSeasonId
      : "";
  const urlSearch = sanitizeStatusReportText(searchParams.get("search"));
  const urlReadiness = parseStatusReportFilter(searchParams.get("status"));
  const urlStage =
    sanitizeStatusReportText(searchParams.get("stage")) || "all";
  const urlReportReadiness = parseReportReadinessFilter(
    searchParams.get("readiness"),
  );

  const [records, setRecords] = useState<StatusReportRecord[]>([]);
  const [search, setSearch] = useState(urlSearch);
  const [readinessFilter, setReadinessFilter] =
    useState<StatusReportFilter>(urlReadiness);
  const [stageFilter, setStageFilter] = useState(urlStage);
  const [reportReadinessFilter, setReportReadinessFilter] =
    useState<ReportReadinessFilter>(urlReportReadiness);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleSeasonResolutionError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function loadStatusReports() {
      if (!selectedSeasonId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/asana?season=${encodeURIComponent(selectedSeasonId)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as StatusReportsApiResponse;

        if (!response.ok || !payload.success || !Array.isArray(payload.tasks)) {
          throw new Error(
            payload.error ?? "Unable to load Weekly Status Reports.",
          );
        }

        setRecords(payload.tasks);
      } catch (loadError) {
        setRecords([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Weekly Status Reports.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStatusReports();
  }, [selectedSeasonId]);

  function replaceStatusReportUrl(
    nextSearch: string,
    nextReadiness: StatusReportFilter,
    nextStage: string,
    nextReportReadiness: ReportReadinessFilter,
  ) {
    window.history.replaceState(
      window.history.state,
      "",
      buildStatusReportsUrl(selectedSeasonId, {
        search: nextSearch,
        readiness: nextReadiness,
        stage: nextStage,
        reportReadiness: nextReportReadiness,
      }),
    );
  }

  const readyCount = useMemo(
    () =>
      records.filter(
        (record) => getStatusReportCategory(record) === "ready",
      ).length,
    [records],
  );
  const blockedCount = records.length - readyCount;
  const reportReadinessCounts = useMemo(
    () => getReportReadinessCounts(records),
    [records],
  );

  const stages = useMemo(
    () =>
      Array.from(
        new Set(records.map((record) => record.clientStage).filter(Boolean)),
      ).sort((left, right) => left.localeCompare(right)),
    [records],
  );

  const filteredRecords = useMemo(
    () =>
      filterStatusReportRecords(records, {
        search,
        readiness: readinessFilter,
        stage: stageFilter,
        reportReadiness: reportReadinessFilter,
      }),
    [readinessFilter, records, reportReadinessFilter, search, stageFilter],
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-6 py-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-56 items-center">
              <Image
                src="/images/rcbs-logo.png"
                alt="Reality Check Business Solutions"
                width={1000}
                height={151}
                priority
                className="h-auto w-full object-contain"
              />
            </div>
            <div className="hidden border-l border-slate-200 pl-5 sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">
                Salinas OS
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                RCBS Control Center
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <SeasonSelector
              selectedSeasonId={requestedSeasonId}
              onSeasonChange={(seasonId) =>
                router.push(
                  buildStatusReportsUrl(seasonId, {
                    search,
                    readiness: readinessFilter,
                    stage: stageFilter,
                    reportReadiness: reportReadinessFilter,
                  }),
                )
              }
              onSeasonResolved={setResolvedSeasonId}
              onSeasonResolutionError={handleSeasonResolutionError}
              disabled={loading}
            />
            <Link
              href={
                selectedSeasonId
                  ? `/?season=${encodeURIComponent(selectedSeasonId)}`
                  : "/"
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
            >
              Executive Dashboard
            </Link>
            <Link
              href={
                selectedSeasonId
                  ? `/tax-returns?season=${encodeURIComponent(selectedSeasonId)}`
                  : "/tax-returns"
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
            >
              Tax Returns
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Manual Reporting Workflow
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Weekly Status Report Center
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Review eligible client status reports for the {selectedSeasonId}
              {" "}Tax Season, then manually print or save approved previews as
              PDF. This version does not create drafts or send email.
            </p>
          </div>

          {!loading && !error && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm text-blue-800">
              <p className="font-semibold">Review-only workflow</p>
              <p className="mt-1">No email has been sent.</p>
            </div>
          )}
        </section>

        {!loading && !error && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard label="All records" value={records.length} />
            <SummaryCard label="Ready for Review" value={readyCount} tone="ready" />
            <SummaryCard label="Blocked" value={blockedCount} tone="blocked" />
            <SummaryCard
              label="Weekly candidates"
              value={reportReadinessCounts.candidate}
              tone="candidate"
            />
            <SummaryCard
              label="Attention required"
              value={reportReadinessCounts["attention-required"]}
              tone="attention"
            />
          </section>
        )}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">
              Report status
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["all", "All", records.length],
                  ["ready", "Ready for Review", readyCount],
                  ["blocked", "Blocked", blockedCount],
                ] as const
              ).map(([value, label, count]) => {
                const isSelected = readinessFilter === value;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setReadinessFilter(value);
                      replaceStatusReportUrl(
                        search,
                        value,
                        stageFilter,
                        reportReadinessFilter,
                      );
                    }}
                    className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800"
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-5 border-t border-slate-200 pt-5">
            <legend className="text-sm font-semibold text-slate-700">
              Weekly report readiness
            </legend>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Applied only after canonical client-status eligibility.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["all", "All readiness", readyCount],
                  ["candidate", "Candidate", reportReadinessCounts.candidate],
                  [
                    "attention-required",
                    "Attention Required",
                    reportReadinessCounts["attention-required"],
                  ],
                  [
                    "not-applicable",
                    "Not Applicable",
                    reportReadinessCounts["not-applicable"],
                  ],
                ] as const
              ).map(([value, label, count]) => {
                const isSelected = reportReadinessFilter === value;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setReportReadinessFilter(value);
                      replaceStatusReportUrl(
                        search,
                        readinessFilter,
                        stageFilter,
                        value,
                      );
                    }}
                    className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800"
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_280px]">
            <label className="block text-sm font-semibold text-slate-700">
              Search
              <input
                value={search}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearch(value);
                  replaceStatusReportUrl(
                    value,
                    readinessFilter,
                    stageFilter,
                    reportReadinessFilter,
                  );
                }}
                placeholder="Search client, stage, project or block reason..."
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Client-facing stage
              <select
                value={stageFilter}
                onChange={(event) => {
                  const value = event.target.value;
                  setStageFilter(value);
                  replaceStatusReportUrl(
                    search,
                    readinessFilter,
                    value,
                    reportReadinessFilter,
                  );
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">All stages</option>
                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {loading && (
          <StatusMessage
            title={`Loading ${selectedSeasonId} report eligibility...`}
            message="Retrieving live workflow information from Asana."
          />
        )}

        {error && (
          <StatusMessage
            title="Weekly Status Reports could not be loaded"
            message={error}
            tone="error"
          />
        )}

        {!loading && !error && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">
                {filteredRecords.length.toLocaleString()} records displayed
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Only records marked Ready for Review can open a client report.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Client / Task",
                      "Client-facing stage",
                      "Progress",
                      "Selected project",
                      "Report eligibility",
                      "Weekly readiness",
                      "Report action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <StatusReportRow
                      key={record.gid}
                      record={record}
                      seasonId={selectedSeasonId}
                      search={search}
                      readiness={readinessFilter}
                      stage={stageFilter}
                      reportReadiness={reportReadinessFilter}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRecords.length === 0 && (
              <div className="p-12 text-center">
                <p className="font-semibold text-slate-700">
                  No records match these filters.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Try a different search, report status or client stage.
                </p>
              </div>
            )}
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Manual delivery safeguard</p>
          <p className="mt-2 leading-6">
            Review the client, stage, status text and PDF before any manual
            delivery. Salinas OS v1 does not store recipients, create email
            drafts, or send messages.
          </p>
        </section>
      </div>
    </main>
  );
}

function StatusReportRow({
  record,
  seasonId,
  search,
  readiness,
  stage,
  reportReadiness,
}: {
  record: StatusReportRecord;
  seasonId: string;
  search: string;
  readiness: StatusReportFilter;
  stage: string;
  reportReadiness: ReportReadinessFilter;
}) {
  const category = getStatusReportCategory(record);
  const blockLabel = getStatusReportBlockLabel(record);
  const progress = clampProgress(record.progressPercent);

  return (
    <tr className="align-top transition hover:bg-slate-50">
      <td className="px-5 py-4">
        <p className="font-semibold text-slate-900">{record.name}</p>
        <p className="mt-1 text-xs text-slate-400">GID: {record.gid}</p>
      </td>
      <td className="px-5 py-4 text-sm font-medium text-slate-700">
        {record.clientStage}
      </td>
      <td className="min-w-36 px-5 py-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-slate-700">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${progress}%` }}
          />
        </div>
      </td>
      <td className="px-5 py-4 text-sm text-slate-600">
        {record.sourceProject?.name ?? "No selected project"}
      </td>
      <td className="max-w-64 px-5 py-4">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
            category === "ready"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {category === "ready" ? "Ready for Review" : "Blocked"}
        </span>
        {blockLabel && (
          <p className="mt-2 text-xs leading-5 text-rose-700">{blockLabel}</p>
        )}
      </td>
      <td className="max-w-72 px-5 py-4">
        {record.reportReadiness.category ? (
          <>
            <ReportReadinessBadge
              category={record.reportReadiness.category}
            />
            <p className="mt-2 text-xs leading-5 text-slate-600">
              {record.reportReadiness.explanation}
            </p>
          </>
        ) : (
          <p className="text-xs leading-5 text-slate-400">
            Evaluated only after canonical eligibility.
          </p>
        )}
      </td>
      <td className="px-5 py-4">
        {category === "ready" ? (
          <Link
            href={buildReportPreviewUrl({
              taskGid: record.gid,
              seasonId,
              source: "status-reports",
              statusState: {
                search,
                readiness,
                stage,
                reportReadiness,
              },
            })}
            className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Review Report
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400">
            Report unavailable
          </span>
        )}
      </td>
    </tr>
  );
}

function ReportReadinessBadge({
  category,
}: {
  category: NonNullable<StatusReportRecord["reportReadiness"]["category"]>;
}) {
  const labels = {
    candidate: "Candidate",
    "attention-required": "Attention Required",
    "not-applicable": "Not Applicable",
  } as const;
  const styles = {
    candidate: "border-blue-200 bg-blue-50 text-blue-700",
    "attention-required": "border-amber-200 bg-amber-50 text-amber-800",
    "not-applicable": "border-slate-200 bg-slate-100 text-slate-600",
  } as const;

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[category]}`}
    >
      {labels[category]}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "ready" | "blocked" | "candidate" | "attention";
}) {
  const styles = {
    neutral: "border-slate-200 bg-white text-slate-950",
    ready: "border-emerald-200 bg-emerald-50 text-emerald-900",
    blocked: "border-rose-200 bg-rose-50 text-rose-900",
    candidate: "border-blue-200 bg-blue-50 text-blue-900",
    attention: "border-amber-200 bg-amber-50 text-amber-900",
  };

  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${styles[tone]}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value.toLocaleString()}</p>
    </article>
  );
}

function StatusMessage({
  title,
  message,
  tone = "neutral",
}: {
  title: string;
  message: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      className={`rounded-2xl border p-8 text-center shadow-sm ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}

export default function WeeklyStatusReportCenterPage() {
  return (
    <Suspense fallback={<StatusReportsLoadingFallback />}>
      <WeeklyStatusReportCenterContent />
    </Suspense>
  );
}
