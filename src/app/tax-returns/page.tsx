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
  buildReportPreviewUrl,
  buildStatusReportsUrl,
} from "@/features/status-reports/status-report-navigation";

type CustomField = {
  name?: string;
  display_value?: string | null;
  text_value?: string | null;
  enum_value?: {
    name?: string;
  } | null;
};

type TaxReturnTask = {
  gid: string;
  name: string;
  completed?: boolean;
  due_on?: string | null;

  assignee?: {
    name?: string;
  } | null;

  section?: string | null;
  asanaSectionName?: string | null;
  pipelineStage?: string | null;
  clientStage?: string | null;

  progressPercent?: number;
  workflowType?:
    | "standard-tax"
    | "tax-with-accounting"
    | "tax-with-bookkeeping"
    | "unknown";

  mappingStatus?: "mapped" | "unmapped";
  clientVisible?: boolean;
  isTaxReturn?: boolean;

  memberships?: Array<{
    section?: {
      name?: string;
    };
  }>;

  custom_fields?: CustomField[];
};

type TaxReturnsApiResponse = {
  success?: boolean;

  counts?: {
    allRecords?: number;
    taxReturns?: number;
    nonTaxRecords?: number;
    mapped?: number;
    unmapped?: number;
  };

  tasks?: TaxReturnTask[];
  taxReturns?: TaxReturnTask[];

  data?:
    | TaxReturnTask[]
    | {
        tasks?: TaxReturnTask[];
        taxReturns?: TaxReturnTask[];
      };

  error?: string;
};

function getCustomFieldValue(
  customFields: CustomField[] | undefined,
  fieldName: string,
): string {
  const field = customFields?.find(
    (item) =>
      item.name?.toLowerCase() === fieldName.toLowerCase(),
  );

  return (
    field?.display_value ??
    field?.enum_value?.name ??
    field?.text_value ??
    ""
  );
}

function getPipelineStage(task: TaxReturnTask): string {
  return (
    task.clientStage ??
    task.pipelineStage ??
    task.section ??
    task.memberships?.[0]?.section?.name ??
    "Status Under Review"
  );
}

function getProgressPercent(task: TaxReturnTask): number {
  const progress = task.progressPercent ?? 0;

  return Math.min(100, Math.max(0, progress));
}

function normalizeTaxReturns(payload: unknown): TaxReturnTask[] {
  if (Array.isArray(payload)) {
    return (payload as TaxReturnTask[]).filter(
      (task) => task.isTaxReturn !== false,
    );
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = payload as TaxReturnsApiResponse;

  /*
   * The API returns:
   * - tasks: every Asana record
   * - taxReturns: records approved by the eligibility engine
   *
   * The Tax Center must always prefer taxReturns.
   */
  if (Array.isArray(response.taxReturns)) {
    return response.taxReturns;
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data) &&
    Array.isArray(response.data.taxReturns)
  ) {
    return response.data.taxReturns;
  }

  if (Array.isArray(response.data)) {
    return response.data.filter(
      (task) => task.isTaxReturn !== false,
    );
  }

  /*
   * These fallbacks preserve compatibility with older API formats,
   * while still excluding records explicitly marked as non-tax.
   */
  if (Array.isArray(response.tasks)) {
    return response.tasks.filter(
      (task) => task.isTaxReturn === true,
    );
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data) &&
    Array.isArray(response.data.tasks)
  ) {
    return response.data.tasks.filter(
      (task) => task.isTaxReturn === true,
    );
  }

  return [];
}

function StageBadge({ stage }: { stage: string }) {
  const normalized = stage.toLowerCase();

  let styles =
    "border-slate-200 bg-slate-50 text-slate-700";

  if (normalized.includes("review")) {
    styles =
      "border-purple-200 bg-purple-50 text-purple-700";
  } else if (
    normalized.includes("tax preparation") ||
    normalized.includes("accounting preparation") ||
    normalized.includes("progress")
  ) {
    styles =
      "border-blue-200 bg-blue-50 text-blue-700";
  } else if (
    normalized.includes("information") ||
    normalized.includes("waiting") ||
    normalized.includes("request") ||
    normalized.includes("signature")
  ) {
    styles =
      "border-amber-200 bg-amber-50 text-amber-700";
  } else if (
    normalized.includes("filed") ||
    normalized.includes("complete")
  ) {
    styles =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}
    >
      {stage}
    </span>
  );
}

function ProgressBar({
  stage,
  progressPercent,
}: {
  stage: string;
  progressPercent: number;
}) {
  return (
    <div className="min-w-40">
      <div className="mb-2 flex items-center justify-between gap-4 text-xs">
        <span
          className="max-w-28 truncate text-slate-500"
          title={stage}
        >
          {stage}
        </span>

        <span className="font-semibold text-slate-700">
          {progressPercent}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{
            width: `${progressPercent}%`,
          }}
        />
      </div>
    </div>
  );
}

function TaxReturnsLoadingFallback() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-5">
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
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="font-semibold text-slate-700">
            Loading Tax Center...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Preparing tax season information.
          </p>
        </div>
      </div>
    </main>
  );
}

function TaxReturnsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSeasonId = searchParams.get("season")?.trim() ?? "";
  const [resolvedSeasonId, setResolvedSeasonId] = useState("");
  const selectedSeasonId =
    resolvedSeasonId &&
    (!requestedSeasonId || resolvedSeasonId === requestedSeasonId)
      ? resolvedSeasonId
      : "";
  const statusReportsUrl = selectedSeasonId
    ? buildStatusReportsUrl(selectedSeasonId, {
        readiness: "all",
        stage: "all",
        search: "",
      })
    : "/status-reports";

  const [tasks, setTasks] = useState<TaxReturnTask[]>([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleSeasonResolutionError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function loadTaxReturns() {
      if (!selectedSeasonId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/asana?season=${encodeURIComponent(
            selectedSeasonId,
          )}`,
          {
            cache: "no-store",
          },
        );

        const payload: unknown = await response.json();

        if (!response.ok) {
          const apiError =
            payload &&
            typeof payload === "object" &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : `Unable to load tax returns: ${response.status}`;

          throw new Error(apiError);
        }

        const normalizedTasks =
          normalizeTaxReturns(payload);

        if (normalizedTasks.length === 0) {
          throw new Error(
            "The API responded, but no eligible tax returns were found.",
          );
        }

        setTasks(normalizedTasks);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load tax returns.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadTaxReturns();
  }, [selectedSeasonId]);

  const stages = useMemo(() => {
    const uniqueStages = new Set(
      tasks.map(getPipelineStage).filter(Boolean),
    );

    return Array.from(uniqueStages).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const form = getCustomFieldValue(
        task.custom_fields,
        "Form",
      );
      const preparer = task.assignee?.name ?? "";
      const stage = getPipelineStage(task);
      const asanaSection =
        task.asanaSectionName ?? task.section ?? "";

      const matchesSearch =
        !query ||
        task.name.toLowerCase().includes(query) ||
        form.toLowerCase().includes(query) ||
        preparer.toLowerCase().includes(query) ||
        stage.toLowerCase().includes(query) ||
        asanaSection.toLowerCase().includes(query);

      const matchesStage =
        stageFilter === "ALL" ||
        stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [tasks, search, stageFilter]);

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
                  `/tax-returns?season=${encodeURIComponent(
                    seasonId,
                  )}`,
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
              href={statusReportsUrl}
              onClick={(event) => {
                event.preventDefault();
                window.location.assign(statusReportsUrl);
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
            >
              Weekly Status Reports
            </Link>

            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-slate-900">
                Tax Operations
              </p>

              <p className="text-xs text-slate-500">
                {selectedSeasonId} Tax Season
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              RS
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Tax Center
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Tax Returns
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Eligible tax returns synchronized from the{" "}
                {selectedSeasonId} Tax Season project.
              </p>
            </div>

            {!loading && !error && (
              <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Returns displayed
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {filteredTasks.length.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_280px]">
            <div>
              <label
                htmlFor="tax-return-search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search tax returns
              </label>

              <input
                id="tax-return-search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search client, form, preparer or stage..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="stage-filter"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Client stage
              </label>

              <select
                id="stage-filter"
                value={stageFilter}
                onChange={(event) =>
                  setStageFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">All stages</option>

                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="font-semibold text-slate-700">
              Loading eligible {selectedSeasonId} tax
              returns...
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Retrieving live information from Asana.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-800">
              Tax returns could not be loaded
            </p>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Client
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Form
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Client stage
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Preparer
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Due date
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Progress
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => {
                    const form =
                      getCustomFieldValue(
                        task.custom_fields,
                        "Form",
                      ) || "Not assigned";

                    const stage = getPipelineStage(task);
                    const progressPercent =
                      getProgressPercent(task);

                    return (
                      <tr
                        key={task.gid}
                        className="transition hover:bg-blue-50/50"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={buildReportPreviewUrl({
                              taskGid: task.gid,
                              seasonId: selectedSeasonId,
                              source: "tax-returns",
                            })}
                            className="block"
                          >
                            <p className="font-semibold text-slate-900 hover:text-blue-700">
                              {task.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              GID: {task.gid}
                            </p>
                          </Link>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-700">
                          {form}
                        </td>

                        <td className="px-5 py-4">
                          <StageBadge stage={stage} />
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {task.assignee?.name ??
                            "Unassigned"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {task.due_on ?? "No due date"}
                        </td>

                        <td className="px-5 py-4">
                          <ProgressBar
                            stage={stage}
                            progressPercent={
                              progressPercent
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredTasks.length === 0 && (
              <div className="p-12 text-center">
                <p className="font-semibold text-slate-700">
                  No tax returns match your search.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Try a different client name, form or
                  client stage.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default function TaxReturnsPage() {
  return (
    <Suspense fallback={<TaxReturnsLoadingFallback />}>
      <TaxReturnsPageContent />
    </Suspense>
  );
}
