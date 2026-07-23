import { NextRequest, NextResponse } from "next/server";
import { calculateProgress } from "@/features/tax-pipeline/progress/calculate-progress";
import { getTaxSeasonTasks } from "@/features/tax-pipeline/tax-pipeline.service";
import {
  getEnabledSeasonProjects,
  resolveTaxSeason,
} from "@/features/tax-pipeline/tax-seasons";

export async function GET(request: NextRequest) {
  try {
    const requestedSeasonId =
      request.nextUrl.searchParams.get("season");

    const season = resolveTaxSeason(requestedSeasonId);
    const enabledProjects = getEnabledSeasonProjects(season);

    const collection = await getTaxSeasonTasks(season);

    const projectPriority = new Map(
      enabledProjects.map((project, index) => [
        project.asanaProjectGid,
        index,
      ]),
    );

    const enabledProjectGids = new Set(
      enabledProjects.map((project) => project.asanaProjectGid),
    );

    const enrichedTasks = collection.tasks.map((task) => {
      const eligibleMemberships = (task.memberships ?? [])
        .filter((membership) => {
          const membershipProjectGid =
            membership.project?.gid ?? "";

          return enabledProjectGids.has(membershipProjectGid);
        })
        .sort((a, b) => {
          const aProjectGid = a.project?.gid ?? "";
          const bProjectGid = b.project?.gid ?? "";

          const aPriority =
            projectPriority.get(aProjectGid) ??
            Number.MAX_SAFE_INTEGER;

          const bPriority =
            projectPriority.get(bProjectGid) ??
            Number.MAX_SAFE_INTEGER;

          return aPriority - bPriority;
        });

      const selectedMembership = eligibleMemberships[0];

      const asanaSectionName =
        selectedMembership?.section?.name ?? "No section";

      const progress = calculateProgress(asanaSectionName);

      return {
        ...task,

        section: asanaSectionName,
        asanaSectionName,

        sourceProject: selectedMembership?.project
          ? {
              gid: selectedMembership.project.gid,
              name: selectedMembership.project.name,
            }
          : null,

        seasonMemberships: eligibleMemberships.map(
          (membership) => ({
            project: membership.project
              ? {
                  gid: membership.project.gid,
                  name: membership.project.name,
                }
              : null,

            section: membership.section
              ? {
                  gid: membership.section.gid,
                  name: membership.section.name,
                }
              : null,
          }),
        ),

        pipelineStage: progress.clientStage,
        clientStage: progress.clientStage,
        progressPercent: progress.progressPercent,
        workflowType: progress.workflowType,
        mappingStatus: progress.mappingStatus,
        clientVisible: progress.clientVisible,
        isTaxReturn: progress.isTaxReturn,
      };
    });

    const taxReturns = enrichedTasks.filter(
      (task) => task.isTaxReturn,
    );

    const nonTaxRecords = enrichedTasks.filter(
      (task) => !task.isTaxReturn,
    );

    const unmappedRecords = enrichedTasks.filter(
      (task) => task.mappingStatus === "unmapped",
    );

    return NextResponse.json({
      success: true,

      season: {
        id: season.id,
        year: season.year,
        name: season.name,
        status: season.status,
      },

      projects: enabledProjects.map((project) => ({
        id: project.id,
        name: project.name,
        asanaProjectGid: project.asanaProjectGid,
        enabled: project.enabled,
      })),

      counts: {
        projects: enabledProjects.length,
        allRecords: enrichedTasks.length,
        taxReturns: taxReturns.length,
        nonTaxRecords: nonTaxRecords.length,
        mapped:
          enrichedTasks.length - unmappedRecords.length,
        unmapped: unmappedRecords.length,
      },

      tasks: enrichedTasks,
      taxReturns,
      nonTaxRecords,
      unmappedRecords,

      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown Asana error";

    console.error("Failed to load tax-season data:", error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}