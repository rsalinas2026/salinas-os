import { NextResponse } from "next/server";
import {
  getActiveTaxSeason,
  getTaxSeasons,
} from "@/features/tax-pipeline/tax-seasons";

export async function GET() {
  try {
    const seasons = getTaxSeasons();
    const activeSeason = getActiveTaxSeason();

    return NextResponse.json({
      success: true,

      activeSeasonId: activeSeason.id,

      seasons: seasons.map((season) => ({
        id: season.id,
        year: season.year,
        name: season.name,
        status: season.status,

        projectCount: season.projects.length,

        enabledProjectCount: season.projects.filter(
          (project) => project.enabled,
        ).length,

        projects: season.projects.map((project) => ({
          id: project.id,
          name: project.name,
          asanaProjectGid: project.asanaProjectGid,
          enabled: project.enabled,
        })),
      })),

      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown tax-season error";

    console.error("Tax-season API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}