import { asanaFetch } from "@/lib/asana/asana-client";

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

function getProjectGid(): string {
  const projectGid = process.env.ASANA_PROJECT_GID;

  if (!projectGid) {
    throw new Error("Missing ASANA_PROJECT_GID in .env.local");
  }

  return projectGid;
}

export async function getAllProjectTasks(): Promise<AsanaTask[]> {
  const projectGid = getProjectGid();
  const allTasks: AsanaTask[] = [];

  let offset: string | undefined;

  do {
    const params = new URLSearchParams({
      limit: "100",
      opt_fields: [
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
      ].join(","),
    });

    if (offset) {
      params.set("offset", offset);
    }

    const response = await asanaFetch<AsanaTasksResponse>(
      `/projects/${projectGid}/tasks?${params.toString()}`,
    );

    allTasks.push(...response.data);
    offset = response.next_page?.offset;
  } while (offset);

  return allTasks;
}