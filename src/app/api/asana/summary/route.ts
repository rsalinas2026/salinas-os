import { NextResponse } from "next/server";
import {
  getAllProjectTasks,
  type AsanaTask,
} from "@/features/tax-pipeline/tax-pipeline.service";
import { asanaFetch } from "@/lib/asana/asana-client";

type AsanaSection = {
  gid: string;
  name: string;
};

type AsanaProjectResponse = {
  data: {
    gid: string;
    name: string;
  };
};

type AsanaSectionsResponse = {
  data: AsanaSection[];
};

function getProjectGid(): string {
  const projectGid = process.env.ASANA_PROJECT_GID;

  if (!projectGid) {
    throw new Error("Missing required environment variable: ASANA_PROJECT_GID");
  }

  return projectGid;
}

export async function GET() {
  try {
    const projectGid = getProjectGid();

    const [projectResponse, sectionsResponse, tasks] = await Promise.all([
      asanaFetch<AsanaProjectResponse>(
        `/projects/${projectGid}?opt_fields=gid,name`
      ),
      asanaFetch<AsanaSectionsResponse>(
        `/projects/${projectGid}/sections?limit=100&opt_fields=gid,name`
      ),
      getAllProjectTasks(),
    ]);

    const sections = sectionsResponse.data ?? [];

    const pipeline = sections.map((section, index) => {
      const sectionTasks = tasks.filter((task: AsanaTask) =>
        task.memberships?.some(
          (membership) => membership.section?.gid === section.gid
        )
      );

      return {
        gid: section.gid,
        name: section.name,
        order: index + 1,
        taskCount: sectionTasks.length,
        completedCount: sectionTasks.filter((task) => task.completed).length,
        activeCount: sectionTasks.filter((task) => !task.completed).length,
      };
    });

    const assignedTaskIds = new Set(
      pipeline.flatMap((section) =>
        tasks
          .filter((task) =>
            task.memberships?.some(
              (membership) => membership.section?.gid === section.gid
            )
          )
          .map((task) => task.gid)
      )
    );

    return NextResponse.json({
      success: true,
      project: projectResponse.data,
      totals: {
        tasks: tasks.length,
        activeTasks: tasks.filter((task) => !task.completed).length,
        completedTasks: tasks.filter((task) => task.completed).length,
        unassignedToSection: tasks.filter(
          (task) => !assignedTaskIds.has(task.gid)
        ).length,
      },
      pipeline,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Asana summary error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown Asana error",
      },
      { status: 500 }
    );
  }
}
