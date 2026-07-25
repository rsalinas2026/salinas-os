import { NextRequest, NextResponse } from "next/server";
import { buildExecutiveDashboard } from "@/features/executive/executive.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const seasonId = request.nextUrl.searchParams.get("season");
    const dashboard = await buildExecutiveDashboard(seasonId);

    return NextResponse.json(
      {
        success: true,
        dashboard,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Executive dashboard API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate Executive Dashboard data.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
