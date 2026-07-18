import { NextResponse } from "next/server";
import { asanaFetch } from "@/lib/asana/asana-client";

type AsanaResponse<T> = {
  data: T;
};

type AsanaUser = {
  gid: string;
  name: string;
};

type AsanaReference = {
  gid: string;
  name: string;
  resource_type?: string;
};

type AsanaTask = {
  gid: string;
  name: string;
  notes?: string;
  html_notes?: string;
  completed: boolean;
  due_on?: string | null;
  created_at?: string;
  modified_at?: string;
  permalink_url?: string;
  assignee?: AsanaUser | null;
  parent?: AsanaReference | null;
  memberships?: Array<{
    project?: AsanaReference;
    section?: AsanaReference;
  }>;
  custom_fields?: unknown[];
  projects?: AsanaReference[];
  tags?: AsanaReference[];
};

type AsanaRelatedTask = {
  gid: string;
  name: string;
  completed: boolean;
  due_on?: string | null;
  assignee?: AsanaUser | null;
  permalink_url?: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gid: string }> },
) {
  try {
    const { gid } = await params;

    if (!gid) {
      return NextResponse.json(
        {
          success: false,
          error: "Task GID is required.",
        },
        { status: 400 },
      );
    }

    const encodedGid = encodeURIComponent(gid);

    const taskFields = [
      "gid",
      "name",
      "notes",
      "html_notes",
      "completed",
      "assignee.gid",
      "assignee.name",
      "parent.gid",
      "parent.name",
      "memberships.project.gid",
      "memberships.project.name",
      "memberships.section.gid",
      "memberships.section.name",
      "due_on",
      "created_at",
      "modified_at",
      "custom_fields",
      "projects.gid",
      "projects.name",
      "tags.gid",
      "tags.name",
      "permalink_url",
    ].join(",");

    const relatedTaskFields = [
      "gid",
      "name",
      "completed",
      "assignee.gid",
      "assignee.name",
      "due_on",
      "permalink_url",
    ].join(",");

    const [
      taskResponse,
      subtasksResponse,
      dependenciesResponse,
      dependentsResponse,
    ] = await Promise.all([
      asanaFetch<AsanaResponse<AsanaTask>>(
        `/tasks/${encodedGid}?opt_fields=${encodeURIComponent(taskFields)}`,
      ),

      asanaFetch<AsanaResponse<AsanaRelatedTask[]>>(
        `/tasks/${encodedGid}/subtasks?opt_fields=${encodeURIComponent(
          relatedTaskFields,
        )}`,
      ),

      asanaFetch<AsanaResponse<AsanaRelatedTask[]>>(
        `/tasks/${encodedGid}/dependencies?opt_fields=${encodeURIComponent(
          relatedTaskFields,
        )}`,
      ),

      asanaFetch<AsanaResponse<AsanaRelatedTask[]>>(
        `/tasks/${encodedGid}/dependents?opt_fields=${encodeURIComponent(
          relatedTaskFields,
        )}`,
      ),
    ]);

    return NextResponse.json({
      success: true,

      task: taskResponse.data,

      relationships: {
        parent: taskResponse.data.parent ?? null,
        subtasks: subtasksResponse.data,
        dependencies: dependenciesResponse.data,
        dependents: dependentsResponse.data,
      },

      diagnostics: {
        hasNotes: Boolean(taskResponse.data.notes?.trim()),
        notesLength: taskResponse.data.notes?.length ?? 0,
        hasParent: Boolean(taskResponse.data.parent),
        subtaskCount: subtasksResponse.data.length,
        dependencyCount: dependenciesResponse.data.length,
        dependentCount: dependentsResponse.data.length,
      },
    });
  } catch (error) {
    console.error("Failed to load Asana task diagnostic:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load the Asana task.",
      },
      { status: 500 },
    );
  }
}