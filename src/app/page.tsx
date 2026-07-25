"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import SeasonSelector from "@/components/SeasonSelector";

type TaxReturnTask = {
  gid: string;
  name: string;
  completed?: boolean;
  clientStage?: string | null;
  pipelineStage?: string | null;
  progressPercent?: number;
  mappingStatus?: "mapped" | "unmapped";
  clientVisible?: boolean;
  isTaxReturn?: boolean;
};

type ApiResponse = {
  success?: boolean;

  season?: {
    id: string;
    year: number;
    name: string;
    status: string;
  };

  projects?: Array<{
    id: string;
    name: string;
    asanaProjectGid: string;
    enabled: boolean;
  }>;

  counts?: {
    projects?: number;
    allRecords?: number;
    taxReturns?: number;
    nonTaxRecords?: number;
    mapped?: number;
    unmapped?: number;
  };

  taxReturns?: TaxReturnTask[];
  error?: string;
};

type StageSummary = {
  stage: string;
  progress: number;
  count: number;
};

const STAGE_ORDER = [
  "Initial Review",
  "Information Collection",
  "Accounting Preparation",
  "Tax Preparation",
  "Internal Review",
  "Signature",
  "Filing in Progress",
  "Filed",
  "Status Under Review",
];

const STAGE_PROGRESS: Record<string, number> = {
  "Initial Review": 10,
  "Information Collection": 25,
  "Accounting Preparation": 40,
  "Tax Preparation": 60,
  "Internal Review": 75,
  Signature: 90,
  "Filing in Progress": 95,
  Filed: 100,
  "Status Under Review": 0,
};

function getClientStage(task: TaxReturnTask): string {
  return (
    task.clientStage ??
    task.pipelineStage ??
    "Status Under Review"
  );
}

function getProgress(task: TaxReturnTask): number {
  const progress = task.progressPercent ?? 0;

  return Math.min(100, Math.max(0, progress));
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

export default function ExecutiveDashboardPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [selectedSeasonName, setSelectedSeasonName] = useState("");
  const [projectCount, setProjectCount] = useState(0);
  const [taxReturns, setTaxReturns] = useState<TaxReturnTask[]>([]);
  const [allRecordCount, setAllRecordCount] = useState(0);
  const [nonTaxRecordCount, setNonTaxRecordCount] = useState(0);
  const [unmappedCount, setUnmappedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const urlSeasonId = new URLSearchParams(
      window.location.search,
    ).get("season");

    if (urlSeasonId?.trim()) {
      setSelectedSeasonId(urlSeasonId);
    }
  }, []);

  const handleSeasonChange = useCallback((seasonId: string) => {
    setSelectedSeasonId(seasonId);

    const url = new URL(window.location.href);
    url.searchParams.set("season", seasonId);
    window.history.replaceState({}, "", url.toString());
  }, []);

  useEffect(() => {
    if (!selectedSeasonId) {
      return;
    }

    const seasonId = selectedSeasonId;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/asana?season=${encodeURIComponent(seasonId)}`,
          {
            cache: "no-store",
          },
        );

        const payload = (await response.json()) as ApiResponse;

        if (!response.ok || !payload.success) {
          throw new Error(
            payload.error ?? "Unable to load dashboard data.",
          );
        }

        if (!Array.isArray(payload.taxReturns)) {
          throw new Error(
            "The Asana API did not return the tax-return dataset.",
          );
        }

        setSelectedSeasonName(payload.season?.name ?? seasonId);
        setProjectCount(
          payload.counts?.projects ??
            payload.projects?.length ??
            0,
        );
        setTaxReturns(payload.taxReturns);
        setAllRecordCount(payload.counts?.allRecords ?? 0);
        setNonTaxRecordCount(
          payload.counts?.nonTaxRecords ?? 0,
        );
        setUnmappedCount(payload.counts?.unmapped ?? 0);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [selectedSeasonId]);

  const dashboard = useMemo(() => {
    const stageCounts = new Map<string, number>();

    for (const stage of STAGE_ORDER) {
      stageCounts.set(stage, 0);
    }

    for (const task of taxReturns) {
      const stage = getClientStage(task);

      stageCounts.set(
        stage,
        (stageCounts.get(stage) ?? 0) + 1,
      );
    }

    const stages: StageSummary[] = STAGE_ORDER.map((stage) => ({
      stage,
      progress: STAGE_PROGRESS[stage] ?? 0,
      count: stageCounts.get(stage) ?? 0,
    })).filter((stage) => stage.count > 0);

    const totalReturns = taxReturns.length;

    const totalProgress = taxReturns.reduce(
      (sum, task) => sum + getProgress(task),
      0,
    );

    const averageProgress =
      totalReturns > 0
        ? Math.round(totalProgress / totalReturns)
        : 0;

    const filed = stageCounts.get("Filed") ?? 0;

    const inPreparation =
      (stageCounts.get("Accounting Preparation") ?? 0) +
      (stageCounts.get("Tax Preparation") ?? 0);

    const waitingOnClient =
      (stageCounts.get("Information Collection") ?? 0) +
      (stageCounts.get("Signature") ?? 0);

    const inReview =
      stageCounts.get("Internal Review") ?? 0;

    const nearCompletion =
      (stageCounts.get("Signature") ?? 0) +
      (stageCounts.get("Filing in Progress") ?? 0);

    const activeReturns = totalReturns - filed;

    return {
      stages,
      totalReturns,
      averageProgress,
      filed,
      inPreparation,
      waitingOnClient,
      inReview,
      nearCompletion,
      activeReturns,
    };
  }, [taxReturns]);

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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SeasonSelector
              selectedSeasonId={selectedSeasonId}
              onSeasonChange={handleSeasonChange}
              disabled={loading}
            />

            <Link
              href={
                selectedSeasonId
                  ? `/tax-returns?season=${encodeURIComponent(
                      selectedSeasonId,
                    )}`
                  : "/tax-returns"
              }
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              View Tax Returns
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              RS
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            Executive Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Tax Operations Overview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Live operational intelligence based only on records
            classified as tax returns.
          </p>

          {selectedSeasonName && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
                {selectedSeasonName}
              </span>

              <span className="text-slate-500">
                {projectCount.toLocaleString()} enabled Asana project
                {projectCount === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </header>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="font-semibold text-slate-700">
              Loading executive dashboard...
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Calculating live tax-pipeline performance.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-800">
              Dashboard could not be loaded
            </p>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            {unmappedCount > 0 && (
              <section className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
                <p className="font-semibold text-amber-900">
                  Classification review required
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  {unmappedCount.toLocaleString()} record
                  {unmappedCount === 1 ? "" : "s"} belong to new or
                  renamed Asana sections and are excluded from tax
                  metrics until reviewed.
                </p>
              </section>
            )}

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Tax Returns"
                value={dashboard.totalReturns}
                description="Records classified as actual tax returns"
              />

              <MetricCard
                label="Average Progress"
                value={`${dashboard.averageProgress}%`}
                description="Average completion across tax returns"
              />

              <MetricCard
                label="In Preparation"
                value={dashboard.inPreparation}
                description="Accounting or tax preparation"
              />

              <MetricCard
                label="Filed"
                value={dashboard.filed}
                description="Returns completed and filed"
              />
            </section>

            <section className="mt-6 grid gap-5 md:grid-cols-3">
              <OperationalCard
                label="Waiting on Client"
                value={dashboard.waitingOnClient}
                description="Information collection or signature"
              />

              <OperationalCard
                label="Internal Review"
                value={dashboard.inReview}
                description="Returns undergoing quality control"
              />

              <OperationalCard
                label="Near Completion"
                value={dashboard.nearCompletion}
                description="Signature or filing in progress"
              />
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-950">
                    Pipeline Distribution
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Number of actual tax returns in each RCBS client
                    stage.
                  </p>
                </div>

                <div className="space-y-5">
                  {dashboard.stages.map((stage) => {
                    const percentage =
                      dashboard.totalReturns > 0
                        ? Math.round(
                            (stage.count /
                              dashboard.totalReturns) *
                              100,
                          )
                        : 0;

                    return (
                      <div key={stage.stage}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStageStyles(
                                stage.stage,
                              )}`}
                            >
                              {stage.stage}
                            </span>

                            <span className="text-xs text-slate-400">
                              {stage.progress}% progress
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900">
                              {stage.count.toLocaleString()}
                            </span>

                            <span className="ml-2 text-xs text-slate-500">
                              {percentage}%
                            </span>
                          </div>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-950">
                    Overall Completion
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Average completion across actual tax returns.
                  </p>

                  <div className="mt-8 flex justify-center">
                    <div className="flex h-44 w-44 items-center justify-center rounded-full border-[16px] border-blue-100">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-slate-950">
                          {dashboard.averageProgress}%
                        </p>

                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Complete
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 rounded-xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      Active tax workload
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {dashboard.activeReturns.toLocaleString()} tax
                      returns remain somewhere in the active workflow.
                    </p>
                  </div>

                  <Link
                    href={
                      selectedSeasonId
                        ? `/tax-returns?season=${encodeURIComponent(
                            selectedSeasonId,
                          )}`
                        : "/tax-returns"
                    }
                    className="mt-6 block rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
                  >
                    Open Tax Returns List
                  </Link>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-950">
                    Data Classification
                  </h2>

                  <div className="mt-5 space-y-4">
                    <ClassificationRow
                      label="All Asana records"
                      value={allRecordCount}
                    />

                    <ClassificationRow
                      label="Tax returns"
                      value={dashboard.totalReturns}
                    />

                    <ClassificationRow
                      label="Administrative records"
                      value={nonTaxRecordCount}
                    />

                    <ClassificationRow
                      label="Needs classification"
                      value={unmappedCount}
                    />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
        {typeof value === "number"
          ? value.toLocaleString()
          : value}
      </p>

      <p className="mt-3 text-sm text-slate-500">
        {description}
      </p>
    </article>
  );
}

function OperationalCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {label}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <p className="text-3xl font-bold text-blue-700">
          {value.toLocaleString()}
        </p>
      </div>
    </article>
  );
}

function ClassificationRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm text-slate-600">
        {label}
      </p>

      <p className="text-sm font-bold text-slate-900">
        {value.toLocaleString()}
      </p>
    </div>
  );
}