"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import SeasonSelector from "@/components/SeasonSelector";

type ExecutiveStageMetric = {
  stage: string;
  order: number;
  progressPercent: number;
  total: number;
  active: number;
  completed: number;
  percentageOfPipeline: number;
};

type ExecutiveWorkflowMetric = {
  workflowType: string;
  total: number;
  percentageOfPipeline: number;
};

type ExecutiveProjectMetric = {
  projectGid: string;
  projectName: string;
  totalRecords: number;
};

type ExecutiveUnmappedSectionMetric = {
  sectionName: string;
  total: number;
};

type ExecutiveDashboardData = {
  season: {
    id: string;
    year: number;
    name: string;
    status: string;
  };
  pipeline: {
    totalAsanaRecords: number;
    totalTaxReturns: number;
    activeTaxReturns: number;
    filedTaxReturns: number;
    mappedNonTaxRecords: number;
    unmappedRecords: number;
    excludedRecords: number;
    assignedTaxReturns: number;
    unassignedTaxReturns: number;
    overdueTaxReturns: number;
    averageProgressPercent: number;
  };
  stages: ExecutiveStageMetric[];
  workflows: ExecutiveWorkflowMetric[];
  projects: ExecutiveProjectMetric[];
  unmappedSections: ExecutiveUnmappedSectionMetric[];
  generatedAt: string;
};

type ExecutiveApiResponse = {
  success: boolean;
  dashboard?: ExecutiveDashboardData;
  error?: string;
};

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getStageStyles(stage: string): string {
  switch (stage) {
    case "Initial Review":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "Information Collection":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Accounting Preparation":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Tax Preparation":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "Internal Review":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "Signature":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Filing in Progress":
      return "border-teal-200 bg-teal-50 text-teal-700";
    case "Filed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
}

function getWorkflowLabel(workflowType: string): string {
  switch (workflowType) {
    case "standard-tax":
      return "Standard Tax";
    case "tax-with-accounting":
      return "Tax + Accounting";
    case "tax-with-bookkeeping":
      return "Tax + Bookkeeping";
    case "unknown":
      return "Workflow Under Review";
    default:
      return workflowType;
  }
}

function ExecutiveDashboardContent() {
  const searchParams = useSearchParams();
  const [selectedSeasonId, setSelectedSeasonId] = useState(
    () => searchParams.get("season")?.trim() || "2026",
  );
  const [dashboard, setDashboard] = useState<ExecutiveDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const handleSeasonChange = useCallback((seasonId: string) => {
    setSelectedSeasonId(seasonId);
    const url = new URL(window.location.href);
    url.searchParams.set("season", seasonId);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const loadDashboard = useCallback(async (showFullLoading: boolean) => {
    if (!selectedSeasonId) return;

    try {
      if (showFullLoading) setLoading(true);
      else setRefreshing(true);
      setError("");

      const response = await fetch(
        `/api/executive?season=${encodeURIComponent(selectedSeasonId)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as ExecutiveApiResponse;

      if (!response.ok || !payload.success || !payload.dashboard) {
        throw new Error(payload.error ?? "Unable to load Executive Dashboard.");
      }

      setDashboard(payload.dashboard);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load Executive Dashboard.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSeasonId]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadDashboard(true);
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadDashboard, selectedSeasonId]);

  const taxReturnsUrl = selectedSeasonId
    ? `/tax-returns?season=${encodeURIComponent(selectedSeasonId)}`
    : "/tax-returns";

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
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Salinas OS</p>
              <p className="mt-1 text-sm font-medium text-slate-500">Executive Intelligence</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SeasonSelector
              selectedSeasonId={selectedSeasonId}
              onSeasonChange={handleSeasonChange}
              disabled={loading || refreshing}
            />
            <button
              type="button"
              onClick={() => void loadDashboard(false)}
              disabled={loading || refreshing || !selectedSeasonId}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
            <Link
              href={taxReturnsUrl}
              className="rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              View Tax Returns
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              >
                Sign Out
              </button>
            </form>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">RS</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Executive Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Tax Operations Command Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Live operational intelligence generated by the Salinas OS Executive Service using mapped Asana workflows.
            </p>
          </div>
          {dashboard && (
            <div className="text-left lg:text-right">
              <p className="text-sm font-semibold text-slate-900">{dashboard.season.name}</p>
              <p className="mt-1 text-xs text-slate-500">Last refreshed {formatTimestamp(dashboard.generatedAt)}</p>
            </div>
          )}
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="font-semibold text-slate-700">Building executive intelligence...</p>
            <p className="mt-2 text-sm text-slate-500">Reading Asana and calculating pipeline performance.</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-800">Executive Dashboard could not be loaded</p>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && dashboard && (
          <>
            {dashboard.pipeline.unmappedRecords > 0 && (
              <section className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
                <p className="font-semibold text-amber-900">Classification review required</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  {formatNumber(dashboard.pipeline.unmappedRecords)} Asana records belong to new, renamed, or unrecognized sections. They remain excluded from executive tax metrics.
                </p>
              </section>
            )}

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total Tax Returns" value={formatNumber(dashboard.pipeline.totalTaxReturns)} description="Records classified as actual tax returns" />
              <MetricCard label="Average Completion" value={formatPercentage(dashboard.pipeline.averageProgressPercent)} description="Average progress across the full tax pipeline" />
              <MetricCard label="Filed" value={formatNumber(dashboard.pipeline.filedTaxReturns)} description="Tax returns currently classified as filed" />
              <MetricCard label="Active Workload" value={formatNumber(dashboard.pipeline.activeTaxReturns)} description="Returns remaining in active workflow stages" />
            </section>

            <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <OperationalCard label="Overdue" value={dashboard.pipeline.overdueTaxReturns} description="Open tax returns past their Asana due date" alert={dashboard.pipeline.overdueTaxReturns > 0} />
              <OperationalCard label="Unassigned" value={dashboard.pipeline.unassignedTaxReturns} description="Tax returns without a current assignee" alert={dashboard.pipeline.unassignedTaxReturns > 0} />
              <OperationalCard label="Assigned" value={dashboard.pipeline.assignedTaxReturns} description="Tax returns assigned to a team member" />
              <OperationalCard label="Excluded Records" value={dashboard.pipeline.excludedRecords} description="Administrative or non-tax Asana records" />
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-950">Pipeline Distribution</h2>
                  <p className="mt-1 text-sm text-slate-500">Current location of every classified tax return.</p>
                </div>
                {dashboard.stages.length === 0 ? (
                  <EmptyState message="No mapped tax stages were found." />
                ) : (
                  <div className="space-y-5">
                    {dashboard.stages.map((stage) => (
                      <div key={stage.stage}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStageStyles(stage.stage)}`}>{stage.stage}</span>
                            <span className="text-xs text-slate-400">{stage.progressPercent}% milestone</span>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-sm font-bold text-slate-900">{formatNumber(stage.total)}</span>
                            <span className="ml-2 text-xs text-slate-500">{formatPercentage(stage.percentageOfPipeline)}</span>
                          </div>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, stage.percentageOfPipeline))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-950">Overall Completion</h2>
                  <p className="mt-1 text-sm text-slate-500">Weighted average across classified tax returns.</p>
                  <div className="mt-8 flex justify-center">
                    <div className="flex h-44 w-44 items-center justify-center rounded-full border-[16px] border-blue-100">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-slate-950">{formatPercentage(dashboard.pipeline.averageProgressPercent)}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Complete</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 rounded-xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">Active tax workload</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{formatNumber(dashboard.pipeline.activeTaxReturns)} returns remain in the active tax workflow.</p>
                  </div>
                  <Link href={taxReturnsUrl} className="mt-6 block rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700">Open Tax Returns List</Link>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-950">Data Classification</h2>
                  <div className="mt-5 space-y-4">
                    <ClassificationRow label="All Asana records" value={dashboard.pipeline.totalAsanaRecords} />
                    <ClassificationRow label="Actual tax returns" value={dashboard.pipeline.totalTaxReturns} />
                    <ClassificationRow label="Mapped non-tax records" value={dashboard.pipeline.mappedNonTaxRecords} />
                    <ClassificationRow label="Needs classification" value={dashboard.pipeline.unmappedRecords} />
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">Workflow Mix</h2>
                <p className="mt-1 text-sm text-slate-500">Tax workload grouped by operational workflow.</p>
                {dashboard.workflows.length === 0 ? (
                  <div className="mt-6"><EmptyState message="No workflow information is available." /></div>
                ) : (
                  <div className="mt-6 space-y-5">
                    {dashboard.workflows.map((workflow) => (
                      <div key={workflow.workflowType}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-slate-700">{getWorkflowLabel(workflow.workflowType)}</p>
                          <p className="text-sm font-bold text-slate-900">
                            {formatNumber(workflow.total)}
                            <span className="ml-2 text-xs font-medium text-slate-500">{formatPercentage(workflow.percentageOfPipeline)}</span>
                          </p>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.min(100, Math.max(0, workflow.percentageOfPipeline))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">Connected Projects</h2>
                <p className="mt-1 text-sm text-slate-500">Enabled Asana projects included in this tax season.</p>
                {dashboard.projects.length === 0 ? (
                  <div className="mt-6"><EmptyState message="No enabled Asana projects were found." /></div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {dashboard.projects.map((project) => (
                      <div key={project.projectGid} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{project.projectName}</p>
                          <p className="mt-1 text-xs text-slate-500">Asana project {project.projectGid}</p>
                        </div>
                        <p className="text-lg font-bold text-slate-950">{formatNumber(project.totalRecords)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {dashboard.unmappedSections.length > 0 && (
              <section className="mt-8 rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">Sections Requiring Review</h2>
                <p className="mt-1 text-sm text-slate-500">These Asana sections are not currently included in executive tax metrics.</p>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {dashboard.unmappedSections.map((section) => (
                    <div key={section.sectionName} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-semibold text-amber-900">{section.sectionName}</p>
                      <p className="text-sm font-bold text-amber-900">{formatNumber(section.total)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function DashboardLoadingFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="font-semibold text-slate-700">
          Building executive intelligence...
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Preparing the Executive Dashboard.
        </p>
      </div>
    </main>
  );
}

export default function ExecutiveDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <ExecutiveDashboardContent />
    </Suspense>
  );
}

function MetricCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}

function OperationalCard({ label, value, description, alert = false }: { label: string; value: number; description: string; alert?: boolean }) {
  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${alert ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={`text-sm font-semibold ${alert ? "text-amber-900" : "text-slate-700"}`}>{label}</p>
          <p className={`mt-1 text-sm leading-6 ${alert ? "text-amber-700" : "text-slate-500"}`}>{description}</p>
        </div>
        <p className={`text-3xl font-bold ${alert ? "text-amber-800" : "text-blue-700"}`}>{formatNumber(value)}</p>
      </div>
    </article>
  );
}

function ClassificationRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-sm font-bold text-slate-900">{formatNumber(value)}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
