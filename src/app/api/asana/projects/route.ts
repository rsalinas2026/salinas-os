import { NextResponse } from "next/server";
import { asanaFetch } from "@/lib/asana/asana-client";
import { listOperationalTaxSeasons } from "@/features/tax-pipeline/configuration/operational-tax-season-configuration";
import type { TaxSeason } from "@/features/tax-pipeline/tax-season-domain";

type AsanaWorkspace = {
  gid: string;
  name: string;
  resource_type?: string;
};

type AsanaProject = {
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
};

type AsanaWorkspaceResponse = {
  data: AsanaWorkspace[];
  next_page?: {
    offset?: string;
  } | null;
};

type AsanaProjectsResponse = {
  data: AsanaProject[];
  next_page?: {
    offset?: string;
  } | null;
};

type ProjectSeasonAssignment = {
  seasonId: string;
  seasonName: string;
  seasonYear: number;
  projectId: string;
  enabled: boolean;
};

type DiscoveredProject = AsanaProject & {
  workspaceGid: string;
  workspaceName: string;
  assigned: boolean;
  assignments: ProjectSeasonAssignment[];
};

const PROJECT_OPT_FIELDS = [
  "gid",
  "name",
  "archived",
  "color",
  "created_at",
  "modified_at",
  "owner.gid",
  "owner.name",
  "team.gid",
  "team.name",
  "workspace.gid",
  "workspace.name",
].join(",");

function buildProjectAssignmentMap(seasons: TaxSeason[]): Map<
  string,
  ProjectSeasonAssignment[]
> {
  const assignmentMap = new Map<
    string,
    ProjectSeasonAssignment[]
  >();

  for (const season of seasons) {
    for (const project of season.projects) {
      const existingAssignments =
        assignmentMap.get(project.asanaProjectGid) ?? [];

      existingAssignments.push({
        seasonId: season.id,
        seasonName: season.name,
        seasonYear: season.year,
        projectId: project.id,
        enabled: project.enabled,
      });

      assignmentMap.set(
        project.asanaProjectGid,
        existingAssignments,
      );
    }
  }

  return assignmentMap;
}

async function getAllWorkspaces(): Promise<AsanaWorkspace[]> {
  const workspaces: AsanaWorkspace[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({
      limit: "100",
      opt_fields: "gid,name,resource_type",
    });

    if (offset) {
      params.set("offset", offset);
    }

    const response = await asanaFetch<AsanaWorkspaceResponse>(
      `/workspaces?${params.toString()}`,
    );

    workspaces.push(...(response.data ?? []));
    offset = response.next_page?.offset;
  } while (offset);

  return workspaces;
}

async function getWorkspaceProjects(
  workspace: AsanaWorkspace,
): Promise<AsanaProject[]> {
  const projects: AsanaProject[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({
      workspace: workspace.gid,
      limit: "100",
      archived: "false",
      opt_fields: PROJECT_OPT_FIELDS,
    });

    if (offset) {
      params.set("offset", offset);
    }

    const response = await asanaFetch<AsanaProjectsResponse>(
      `/projects?${params.toString()}`,
    );

    projects.push(...(response.data ?? []));
    offset = response.next_page?.offset;
  } while (offset);

  return projects;
}

export async function GET() {
  try {
    const [workspaces, seasons] = await Promise.all([
      getAllWorkspaces(),
      listOperationalTaxSeasons(),
    ]);
    const assignmentMap = buildProjectAssignmentMap(seasons);

    const workspaceCollections = await Promise.all(
      workspaces.map(async (workspace) => {
        const projects = await getWorkspaceProjects(workspace);

        const discoveredProjects: DiscoveredProject[] = projects
          .map((project) => {
            const assignments =
              assignmentMap.get(project.gid) ?? [];

            return {
              ...project,
              workspaceGid: workspace.gid,
              workspaceName: workspace.name,
              assigned: assignments.length > 0,
              assignments,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        return {
          workspace,
          projects: discoveredProjects,
          projectCount: discoveredProjects.length,
          assignedProjectCount: discoveredProjects.filter(
            (project) => project.assigned,
          ).length,
          unassignedProjectCount: discoveredProjects.filter(
            (project) => !project.assigned,
          ).length,
        };
      }),
    );

    const allProjects = workspaceCollections.flatMap(
      (collection) => collection.projects,
    );

    return NextResponse.json({
      success: true,
      totals: {
        workspaces: workspaceCollections.length,
        projects: allProjects.length,
        assignedProjects: allProjects.filter(
          (project) => project.assigned,
        ).length,
        unassignedProjects: allProjects.filter(
          (project) => !project.assigned,
        ).length,
      },
      seasons,
      workspaces: workspaceCollections,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown Asana project discovery error";

    console.error("Asana project discovery error:", error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
