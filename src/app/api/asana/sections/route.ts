import { NextResponse } from "next/server";
import { asanaFetch } from "@/lib/asana/asana-client";

type AsanaSection = {
  gid: string;
  name: string;
  created_at?: string;
};

type AsanaSectionsResponse = {
  data: AsanaSection[];
};

export async function GET() {
  try {
    const projectGid = process.env.ASANA_PROJECT_GID;

    if (!projectGid) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required environment variable: ASANA_PROJECT_GID",
        },
        { status: 500 },
      );
    }

    const fields = ["gid", "name", "created_at"].join(",");

    const response = await asanaFetch<AsanaSectionsResponse>(
      `/projects/${encodeURIComponent(
        projectGid,
      )}/sections?opt_fields=${encodeURIComponent(fields)}`,
    );

    const sections = response.data.map((section, index) => ({
      gid: section.gid,
      name: section.name,
      position: index + 1,
    }));

    return NextResponse.json({
      success: true,
      projectGid,
      sectionCount: sections.length,
      sections,
    });
  } catch (error) {
    console.error("Failed to load Asana sections:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Asana sections.",
      },
      { status: 500 },
    );
  }
}
