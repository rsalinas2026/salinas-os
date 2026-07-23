"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TaxSeasonStatus = "planned" | "active" | "archived";

type TaxSeasonProject = {
  id: string;
  name: string;
  asanaProjectGid: string;
  enabled: boolean;
};

type TaxSeason = {
  id: string;
  year: number;
  name: string;
  status: TaxSeasonStatus;
  projects: TaxSeasonProject[];
};

type ProjectAssignment = {
  seasonId: string;
  seasonName: string;
  seasonYear: number;
  projectId: string;
  enabled: boolean;
};

type DiscoveredProject = {
  gid: string;
  name: string;
  archived?: boolean;
  color?: string | null;
  created_at?: string | null;
  modified_at?: string | null;

  owner?: {
    gid: string;
    name: string;
  } | null;

  team?: {
    gid: string;
    name: string;
  } | null;

  workspace?: {
    gid: string;
    name: string;
  } | null;

  workspaceGid: string;
  workspaceName: string;
  assigned: boolean;
  assignments: ProjectAssignment[];
};

type WorkspaceCollection = {
  workspace: {
    gid: string;
    name: string;
    resource_type?: string;
  };

  projects: DiscoveredProject[];
  projectCount: number;
  assignedProjectCount: number;
  unassignedProjectCount: number;
};

type ProjectDiscoveryResponse = {
  success?: boolean;

  totals?: {
    workspaces: number;
    projects: number;
    assignedProjects: number;
    unassignedProjects: number;
  };

  seasons?: TaxSeason[];
  workspaces?: WorkspaceCollection[];
  generatedAt?: string;
  error?: string;
};

type ProjectFilter = "all" | "assigned" | "unassigned";

export default function SeasonManagerPage() {
  const [payload, setPayload] =
    useState<ProjectDiscoveryResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState("all");
  const [projectFilter, setProjectFilter] =
    useState<ProjectFilter>("all");

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/asana/projects", {
          cache: "no-store",
        });

        const responsePayload =
          (await response.json()) as ProjectDiscoveryResponse;

        if (!response.ok || !responsePayload.success) {
          throw new Error(
            responsePayload.error ??
              "Unable to discover Asana projects.",
          );
        }

        setPayload(responsePayload);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to discover Asana projects.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProjects();
  }, []);

  const seasons = payload?.seasons ?? [];
  const workspaces = payload?.workspaces ?? [];

  const activeSeason =
    seasons.find((season) => season.status === "active") ?? null;

  const assignedProjects = useMemo(() => {
    return workspaces
      .flatMap((workspace) => workspace.projects)
      .filter((project) => project.assigned)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [workspaces]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return workspaces
      .filter(
        (workspace) =>
          selectedWorkspace === "all" ||
          workspace.workspace.gid === selectedWorkspace,
      )
      .flatMap((workspace) => workspace.projects)
      .filter((project) => {
        if (projectFilter === "assigned" && !project.assigned) {
          return false;
        }

        if (projectFilter === "unassigned" && project.assigned) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const searchableText = [
          project.name,
          project.gid,
          project.workspaceName,
          project.team?.name ?? "",
          project.owner?.name ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (a.assigned !== b.assigned) {
          return a.assigned ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      });
  }, [
    workspaces,
    searchTerm,
    selectedWorkspace,
    projectFilter,
  ]);

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
                Season Management
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
            >
              Executive Dashboard
            </Link>

            <Link
              href="/tax-returns"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Tax Returns
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
            Sprint 5
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Tax Season Manager
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Review configured tax seasons and automatically discovered
            Asana projects. Unassigned projects remain excluded from
            Salinas OS metrics.
          </p>
        </header>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="font-semibold text-slate-700">
              Discovering Asana projects...
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Loading workspaces, projects, and season assignments.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-800">
              Season Manager could not be loaded
            </p>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && payload && (
          <>
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Tax Seasons"
                value={seasons.length}
                description="Configured inside Salinas OS"
              />

              <MetricCard
                label="Asana Workspaces"
                value={payload.totals?.workspaces ?? 0}
                description="Accessible through the current token"
              />

              <MetricCard
                label="Discovered Projects"
                value={payload.totals?.projects ?? 0}
                description="Active Asana projects found"
              />

              <MetricCard
                label="Unassigned Projects"
                value={payload.totals?.unassignedProjects ?? 0}
                description="Excluded from all tax metrics"
              />
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                        Active Season
                      </p>

                      <h2 className="mt-2 text-2xl font-bold text-slate-950">
                        {activeSeason?.name ?? "No active season"}
                      </h2>
                    </div>

                    {activeSeason && (
                      <StatusBadge status={activeSeason.status} />
                    )}
                  </div>

                  {activeSeason ? (
                    <div className="mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <SummaryBox
                          label="Season Year"
                          value={activeSeason.year.toString()}
                        />

                        <SummaryBox
                          label="Assigned Projects"
                          value={activeSeason.projects.length.toString()}
                        />
                      </div>

                      <div className="mt-6">
                        <p className="text-sm font-semibold text-slate-800">
                          Enabled Asana projects
                        </p>

                        <div className="mt-3 space-y-3">
                          {activeSeason.projects.map((project) => (
                            <div
                              key={project.id}
                              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {project.name}
                                  </p>

                                  <p className="mt-1 break-all text-xs text-slate-500">
                                    {project.asanaProjectGid}
                                  </p>
                                </div>

                                <span
                                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    project.enabled
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-200 text-slate-600"
                                  }`}
                                >
                                  {project.enabled
                                    ? "Enabled"
                                    : "Disabled"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-slate-500">
                      No season is currently marked active.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                  <h2 className="text-lg font-bold text-blue-950">
                    Discovery safety control
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-blue-800">
                    Newly discovered projects are not automatically
                    assigned to a season and cannot affect dashboard
                    totals, progress calculations, or client visibility.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <h2 className="text-xl font-bold text-slate-950">
                        Discovered Asana Projects
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Search and review projects available to Salinas OS.
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                      {filteredProjects.length.toLocaleString()} shown
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_220px_180px]">
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                      placeholder="Search project, owner, team, or GID"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <select
                      value={selectedWorkspace}
                      onChange={(event) =>
                        setSelectedWorkspace(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="all">All workspaces</option>

                      {workspaces.map((workspace) => (
                        <option
                          key={workspace.workspace.gid}
                          value={workspace.workspace.gid}
                        >
                          {workspace.workspace.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={projectFilter}
                      onChange={(event) =>
                        setProjectFilter(
                          event.target.value as ProjectFilter,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="all">All projects</option>
                      <option value="assigned">Assigned only</option>
                      <option value="unassigned">
                        Unassigned only
                      </option>
                    </select>
                  </div>
                </div>

                <div className="max-h-[760px] overflow-y-auto">
                  {filteredProjects.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="font-semibold text-slate-700">
                        No projects match the current filters.
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Try changing the search or workspace selection.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredProjects.map((project) => (
                        <ProjectRow
                          key={`${project.workspaceGid}-${project.gid}`}
                          project={project}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {assignedProjects.length > 0 && (
              <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Confirmed Season Assignments
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Projects currently registered in the Salinas OS
                      tax-season configuration.
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                    {assignedProjects.length.toLocaleString()} assigned
                  </span>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ProjectRow({
  project,
}: {
  project: DiscoveredProject;
}) {
  return (
    <article className="p-5 transition hover:bg-slate-50">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-950">
              {project.name}
            </h3>

            {project.assigned ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Assigned
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Unassigned
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
            <span>
              Workspace:{" "}
              <strong className="font-semibold text-slate-700">
                {project.workspaceName}
              </strong>
            </span>

            {project.team?.name && (
              <span>
                Team:{" "}
                <strong className="font-semibold text-slate-700">
                  {project.team.name}
                </strong>
              </span>
            )}

            {project.owner?.name && (
              <span>
                Owner:{" "}
                <strong className="font-semibold text-slate-700">
                  {project.owner.name}
                </strong>
              </span>
            )}
          </div>

          <p className="mt-3 break-all text-xs text-slate-400">
            Asana GID: {project.gid}
          </p>

          {project.assignments.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {project.assignments.map((assignment) => (
                <span
                  key={`${assignment.seasonId}-${assignment.projectId}`}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                >
                  {assignment.seasonName}
                  {assignment.enabled ? " · Enabled" : " · Disabled"}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled
          className="shrink-0 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400"
          title="Project assignment will be enabled in the next Sprint 5 step."
        >
          {project.assigned ? "Already Assigned" : "Assign to Season"}
        </button>
      </div>
    </article>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
        {value.toLocaleString()}
      </p>

      <p className="mt-3 text-sm text-slate-500">
        {description}
      </p>
    </article>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: TaxSeasonStatus;
}) {
  const styles: Record<TaxSeasonStatus, string> = {
    active: "bg-emerald-100 text-emerald-700",
    planned: "bg-blue-100 text-blue-700",
    archived: "bg-slate-200 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}
