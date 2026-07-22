import { asanaFetch } from "@/lib/asana/asana-client";
import {
  getActiveTaxSeason,
  getEnabledSeasonProjects,
  type TaxSeason,
  type TaxSeasonProject,
} from "./tax-seasons";

export type AsanaTask = {
  gid: string;
  name: string;
  completed?: boolean;
  assignee?: {
    gid: string;
    name: string;
  } | null;
  due_on?: string | null;
  memberships?: Array<{
    project?: {
      gid: string;
      name: string;
    } | null;
    section?: {
      gid: string;
      name: string;
    } | null;
  }>;
};

type AsanaTasksResponse = {
  data: AsanaTask[];
  next_page?: {
    offset?: string;
  } | null;
};

export type SeasonTaskCollection = {
  season: TaxSeason;
  projects: TaxSeasonProject[];
  tasks: AsanaTask[];
};

const TASK_OPT_FIELDS = [
  "gid",
  "name",
  "completed",
  "assignee.gid",
  "assignee.name",
  "due_on",
  "memberships.project.gid",
  "memberships.project.name",
  "memberships.section.gid",
  "memberships.section.name",
].join(",");

/**
 * Loads every task from one Asana project, including pagination.
 */
export async function getProjectTasks(
  projectGid: string,
): Promise<AsanaTask[]> {
  const normalizedProjectGid = projectGid.trim();

  if (!normalizedProjectGid) {
    throw new Error("Cannot load Asana tasks without a project GID");
  }

  const allTasks: AsanaTask[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({
      limit: "100",
      opt_fields: TASK_OPT_FIELDS,
    });

    if (offset) {
      params.set("offset", offset);
    }

    const response = await asanaFetch<AsanaTasksResponse>(
      `/projects/${encodeURIComponent(
        normalizedProjectGid,
      )}/tasks?${params.toString()}`,
    );

    allTasks.push(...response.data);
    offset = response.next_page?.offset;
  } while (offset);

  return allTasks;
}

/**
 * Removes duplicate tasks from a combined multi-project task collection.
 *
 * A single Asana task can belong to more than one project. Salinas OS should
 * count that task once within the season while preserving all memberships.
 */
function deduplicateTasks(tasks: AsanaTask[]): AsanaTask[] {
  const tasksByGid = new Map<string, AsanaTask>();

  for (const task of tasks) {
    const existingTask = tasksByGid.get(task.gid);

    if (!existingTask) {
      tasksByGid.set(task.gid, task);
      continue;
    }

    const membershipsByKey = new Map<
      string,
      NonNullable<AsanaTask["memberships"]>[number]
    >();

    for (const membership of existingTask.memberships ?? []) {
      const key = [
        membership.project?.gid ?? "no-project",
        membership.section?.gid ?? "no-section",
      ].join(":");

      membershipsByKey.set(key, membership);
    }

    for (const membership of task.memberships ?? []) {
      const key = [
        membership.project?.gid ?? "no-project",
        membership.section?.gid ?? "no-section",
      ].join(":");

      membershipsByKey.set(key, membership);
    }

    tasksByGid.set(task.gid, {
      ...existingTask,
      ...task,
      memberships: Array.from(membershipsByKey.values()),
    });
  }

  return Array.from(tasksByGid.values());
}

/**
 * Loads all enabled Asana projects associated with a tax season.
 */
export async function getTaxSeasonTasks(
  season: TaxSeason,
): Promise<SeasonTaskCollection> {
  const projects = getEnabledSeasonProjects(season);

  const projectTaskCollections = await Promise.all(
    projects.map(async (project) => ({
      project,
      tasks: await getProjectTasks(project.asanaProjectGid),
    })),
  );

  const combinedTasks = projectTaskCollections.flatMap(
    (collection) => collection.tasks,
  );

  return {
    season,
    projects,
    tasks: deduplicateTasks(combinedTasks),
  };
}

/**
 * Loads all tasks for the currently active tax season.
 */
export async function getActiveTaxSeasonTasks(): Promise<SeasonTaskCollection> {
  return getTaxSeasonTasks(getActiveTaxSeason());
}

/**
 * Backward-compatible helper.
 *
 * Existing routes can continue calling getAllProjectTasks() while Salinas OS
 * transitions from one Asana project to season-based multi-project loading.
 */
export async function getAllProjectTasks(): Promise<AsanaTask[]> {
  const collection = await getActiveTaxSeasonTasks();

  return collection.tasks;
}