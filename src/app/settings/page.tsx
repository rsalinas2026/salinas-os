"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  buildFutureSeasonInput,
  canAssignValidatedProject,
  moveProjectId,
  safeSettingsError,
  type SettingsProjectOrderDirection,
} from "@/features/settings/settings-ui";

type SeasonStatus = "upcoming" | "active" | "archived";

type PersistentProject = {
  id: string;
  asanaProjectGid: string;
  asanaProjectName: string;
  enabled: boolean;
  priority: number;
  validatedAt: string;
};

type PersistentSeason = {
  id: string;
  code: string;
  year: number;
  name: string;
  status: SeasonStatus;
  isDefault: boolean;
  projects: PersistentProject[];
};

type ValidatedProject = {
  gid: string;
  name: string;
  archived: boolean;
  modifiedAt: string | null;
  team: { gid: string; name: string } | null;
  workspace: { gid: string; name: string } | null;
};

type SettingsResponse = {
  success?: boolean;
  seasons?: PersistentSeason[];
  project?: ValidatedProject;
  error?: string;
};

type Feedback = { tone: "success" | "error"; message: string } | null;

async function settingsRequest(
  url: string,
  options?: RequestInit,
): Promise<SettingsResponse> {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: options?.body
      ? { "Content-Type": "application/json", ...options.headers }
      : options?.headers,
  });
  const payload = (await response.json()) as SettingsResponse;

  if (!response.ok || !payload.success) {
    throw new Error(
      safeSettingsError(payload, "Settings could not complete this request."),
    );
  }

  return payload;
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8 3.5-.1-1.2 1.5-1.2-2-3.4-1.8.7a8.4 8.4 0 0 0-2-1.2L15.3 4h-4l-.3 1.7c-.7.3-1.4.7-2 1.2l-1.8-.7-2 3.4 1.5 1.2a8 8 0 0 0 0 2.4l-1.5 1.2 2 3.4 1.8-.7c.6.5 1.3.9 2 1.2l.3 1.7h4l.3-1.7c.7-.3 1.4-.7 2-1.2l1.8.7 2-3.4-1.5-1.2L20 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SettingsPage() {
  const [seasons, setSeasons] = useState<PersistentSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [year, setYear] = useState("");
  const [name, setName] = useState("");

  const loadSeasons = useCallback(async () => {
    try {
      setLoading(true);
      const payload = await settingsRequest("/api/settings/tax-seasons");
      setSeasons(payload.seasons ?? []);
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Settings could not load.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadSeasons();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadSeasons]);

  async function runAction(
    key: string,
    successMessage: string,
    action: () => Promise<unknown>,
  ) {
    try {
      setWorking(key);
      setFeedback(null);
      await action();
      await loadSeasons();
      setFeedback({ tone: "success", message: successMessage });
      return true;
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Settings could not complete this action.",
      });
      return false;
    } finally {
      setWorking("");
    }
  }

  async function createSeason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = buildFutureSeasonInput(year, name);

    if ("error" in input) {
      setFeedback({ tone: "error", message: input.error });
      return;
    }

    const created = await runAction(
      "create-season",
      `${input.value.name} was created as Upcoming. The current season was not changed.`,
      () =>
        settingsRequest("/api/settings/tax-seasons", {
          method: "POST",
          body: JSON.stringify(input.value),
        }),
    );

    if (created) {
      setYear("");
      setName("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-52 items-center sm:w-56">
              <Image src="/images/rcbs-logo.png" alt="Reality Check Business Solutions" width={1000} height={151} priority className="h-auto w-full object-contain" />
            </div>
            <div className="hidden border-l border-slate-200 pl-5 sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Salinas OS</p>
              <p className="mt-1 text-sm font-medium text-slate-500">Administrative Configuration</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700">Executive Dashboard</Link>
            <Link href="/tax-returns" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700">Tax Returns</Link>
            <span className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"><GearIcon /> Settings</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
        <section className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Settings Center</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Tax Season Configuration</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Create future Tax Seasons, validate authoritative Asana projects, and manage project availability and order. Operational dashboards continue using the currently approved configuration until a separate cutover is authorized.</p>
        </section>

        {feedback && (
          <div role="status" className={`mb-6 rounded-2xl border p-4 text-sm font-medium ${feedback.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {feedback.message}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Future Tax Season</p>
              <h2 className="mt-2 text-xl font-bold text-slate-950">Create a Tax Season</h2>
              <p className="mt-2 text-sm text-slate-600">New seasons begin as Upcoming and do not replace the current season.</p>
            </div>
            <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">CURRENT SEASON PROTECTED</span>
          </div>
          <form onSubmit={createSeason} className="mt-5 grid gap-4 md:grid-cols-[0.55fr_1fr_auto] md:items-end">
            <label className="text-sm font-semibold text-slate-700">Year<input value={year} onChange={(event) => { const value = event.target.value; setYear(value); if (!name || /^\d{4} Tax Season$/.test(name)) setName(value ? `${value} Tax Season` : ""); }} inputMode="numeric" placeholder="2027" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-semibold text-slate-700">Season name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="2027 Tax Season" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
            <button type="submit" disabled={Boolean(working)} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{working === "create-season" ? "Creating..." : "Create Season"}</button>
          </form>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"><p className="font-semibold text-slate-700">Loading persistent Tax Seasons...</p></div>
        ) : seasons.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800"><p className="font-semibold">No persistent Tax Seasons are configured.</p></div>
        ) : (
          <section className="space-y-6" aria-label="Configured Tax Seasons">
            {seasons.map((season) => (
              <SeasonCard key={season.id} season={season} working={working} runAction={runAction} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function SeasonCard({ season, working, runAction }: { season: PersistentSeason; working: string; runAction: (key: string, message: string, action: () => Promise<unknown>) => Promise<boolean> }) {
  const [name, setName] = useState(season.name);
  const [year, setYear] = useState(String(season.year));
  const isCurrent = season.status === "active" || season.isDefault;

  async function saveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedYear = Number(year);

    if (!Number.isInteger(parsedYear) || !name.trim()) return;
    const saved = await runAction(`save-${season.id}`, `${season.name} details were updated.`, () => settingsRequest("/api/settings/tax-seasons", { method: "PATCH", body: JSON.stringify({ operation: "update", id: season.id, year: parsedYear, name: name.trim() }) }));
    if (saved) {
      setName(name.trim());
      setYear(String(parsedYear));
    }
  }

  async function setCurrent() {
    if (!window.confirm(`Set ${season.name} as CURRENT? This will replace the existing active/default season.`)) return;
    await runAction(`current-${season.id}`, `${season.name} is now the current Tax Season.`, () => settingsRequest("/api/settings/tax-seasons", { method: "PATCH", body: JSON.stringify({ operation: "set-current", id: season.id }) }));
  }

  async function archive() {
    if (!window.confirm(`Archive ${season.name}? Archived seasons cannot be current.`)) return;
    await runAction(`archive-${season.id}`, `${season.name} was archived.`, () => settingsRequest("/api/settings/tax-seasons", { method: "PATCH", body: JSON.stringify({ operation: "archive", id: season.id }) }));
  }

  return (
    <article className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${isCurrent ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"}`}>
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:p-6 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-950">{season.name}</h2>
            {isCurrent && <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold tracking-wide text-white">CURRENT</span>}
            {season.isDefault && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">DEFAULT</span>}
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${season.status === "active" ? "bg-emerald-100 text-emerald-800" : season.status === "archived" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-800"}`}>{season.status}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{season.projects.length} configured Asana {season.projects.length === 1 ? "project" : "projects"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isCurrent && season.status !== "archived" && <button type="button" onClick={() => void setCurrent()} disabled={Boolean(working)} className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-50">Set as Current</button>}
          {season.status !== "active" && season.status !== "archived" && <button type="button" onClick={() => void archive()} disabled={Boolean(working)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-red-300 hover:text-red-700 disabled:opacity-50">Archive Season</button>}
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-6">
          <form onSubmit={saveMetadata} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-bold text-slate-900">Season Details</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-[0.55fr_1fr]">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Year<input value={year} onChange={(event) => setYear(event.target.value)} inputMode="numeric" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900" /></label>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900" /></label>
            </div>
            <button type="submit" disabled={Boolean(working)} className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700 disabled:opacity-50">Save Details</button>
          </form>
          {isCurrent && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"><p className="font-bold">Current-season protection</p><p className="mt-1 leading-5">At least one project must remain enabled. Set another season as current before archiving this season.</p></div>}
          {season.status !== "archived" && <AddProjectForm season={season} working={working} runAction={runAction} />}
        </div>

        <div>
          <div className="flex items-end justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-950">Asana Projects</h3><p className="mt-1 text-sm text-slate-600">Order 1 is the primary project for deterministic selection.</p></div></div>
          {season.projects.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No Asana projects are assigned.</div> : <div className="mt-4 space-y-3">{season.projects.map((project, index) => <ProjectCard key={project.id} season={season} project={project} index={index} working={working} runAction={runAction} />)}</div>}
        </div>
      </div>
    </article>
  );
}

function AddProjectForm({ season, working, runAction }: { season: PersistentSeason; working: string; runAction: (key: string, message: string, action: () => Promise<unknown>) => Promise<boolean> }) {
  const [gid, setGid] = useState("");
  const [validated, setValidated] = useState<ValidatedProject | null>(null);
  const [validationError, setValidationError] = useState("");

  async function validate() {
    try {
      setValidationError("");
      setValidated(null);
      const payload = await settingsRequest("/api/settings/asana-projects/validate", { method: "POST", body: JSON.stringify({ asanaProjectGid: gid }) });
      setValidated(payload.project ?? null);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Project could not be validated.");
    }
  }

  async function assign() {
    if (!validated || validated.gid !== gid.trim() || !canAssignValidatedProject(validated)) return;
    const assigned = await runAction(`assign-${season.id}`, `${validated.name} was assigned to ${season.name}.`, () => settingsRequest("/api/settings/tax-season-projects", { method: "POST", body: JSON.stringify({ taxSeasonId: season.id, asanaProjectGid: validated.gid }) }));
    if (assigned) { setGid(""); setValidated(null); }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <h3 className="font-bold text-slate-900">Add Asana Project</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">Paste the Project GID. Salinas OS retrieves the name directly from Asana.</p>
      <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500">Asana Project GID<input value={gid} onChange={(event) => { setGid(event.target.value); setValidated(null); setValidationError(""); }} inputMode="numeric" placeholder="Enter project GID" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900" /></label>
      <button type="button" onClick={() => void validate()} disabled={!gid.trim() || Boolean(working)} className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">Validate Project</button>
      {validationError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{validationError}</p>}
      {validated && <div className={`mt-4 rounded-xl border p-4 ${validated.archived ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-slate-950">{validated.name}</p><p className="mt-1 break-all text-xs text-slate-600">Project GID: {validated.gid}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${validated.archived ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{validated.archived ? "ARCHIVED" : "ACTIVE IN ASANA"}</span></div><dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2"><div><dt className="font-bold text-slate-500">Workspace</dt><dd className="mt-1">{validated.workspace?.name ?? "Not provided"}</dd></div><div><dt className="font-bold text-slate-500">Team</dt><dd className="mt-1">{validated.team?.name ?? "Not provided"}</dd></div></dl>{validated.archived ? <p className="mt-3 text-sm font-semibold text-red-800">Archived projects cannot be assigned.</p> : <button type="button" onClick={() => void assign()} disabled={Boolean(working)} className="mt-4 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">Confirm Assignment</button>}</div>}
    </div>
  );
}

function ProjectCard({ season, project, index, working, runAction }: { season: PersistentSeason; project: PersistentProject; index: number; working: string; runAction: (key: string, message: string, action: () => Promise<unknown>) => Promise<boolean> }) {
  async function toggle() {
    await runAction(`toggle-${project.id}`, `${project.asanaProjectName} is now ${project.enabled ? "disabled" : "enabled"}.`, () => settingsRequest("/api/settings/tax-season-projects", { method: "PATCH", body: JSON.stringify({ operation: "set-enabled", id: project.id, enabled: !project.enabled }) }));
  }
  async function move(direction: SettingsProjectOrderDirection) {
    const projectIds = moveProjectId(season.projects.map((item) => item.id), project.id, direction);
    await runAction(`reorder-${season.id}`, "Project order was updated.", () => settingsRequest("/api/settings/tax-season-projects", { method: "PATCH", body: JSON.stringify({ operation: "reorder", taxSeasonId: season.id, projectIds }) }));
  }
  async function remove() {
    if (!window.confirm(`Remove ${project.asanaProjectName} from ${season.name}? This does not delete the project in Asana.`)) return;
    await runAction(`remove-${project.id}`, `${project.asanaProjectName} was removed from ${season.name}.`, () => settingsRequest("/api/settings/tax-season-projects", { method: "DELETE", body: JSON.stringify({ id: project.id }) }));
  }

  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{index + 1}</span><h4 className="font-bold text-slate-950">{project.asanaProjectName}</h4><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${project.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{project.enabled ? "ENABLED" : "DISABLED"}</span></div><p className="mt-2 break-all text-xs text-slate-500">Asana Project GID: {project.asanaProjectGid}</p></div>
        <button type="button" onClick={() => void toggle()} disabled={Boolean(working)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:border-blue-400 hover:text-blue-700 disabled:opacity-50">{project.enabled ? "Disable" : "Enable"}</button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:flex">
        <button type="button" onClick={() => void move("up")} disabled={index === 0 || Boolean(working)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">Move Up</button>
        <button type="button" onClick={() => void move("down")} disabled={index === season.projects.length - 1 || Boolean(working)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">Move Down</button>
        <button type="button" onClick={() => void remove()} disabled={Boolean(working)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40">Remove</button>
      </div>
    </article>
  );
}
