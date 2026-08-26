import { NextRequest, NextResponse } from "next/server";
import { evaluateReportReadiness } from "@/features/status-reports/report-readiness";
import { classifyTaxReturnTask } from "@/features/tax-pipeline/classify-tax-return";
import { resolveOperationalTaxSeason } from "@/features/tax-pipeline/configuration/operational-tax-season-configuration";
import { getEnabledSeasonProjects } from "@/features/tax-pipeline/tax-season-domain";
import { getTaxSeasonTasks } from "@/features/tax-pipeline/tax-pipeline.service";

export async function GET(request: NextRequest) {
  try {
    const requestedSeasonId =
      request.nextUrl.searchParams.get("season");

    const season = await resolveOperationalTaxSeason(requestedSeasonId);
    const enabledProjects = getEnabledSeasonProjects(season);

    const collection = await getTaxSeasonTasks(season);

    const enabledProjectGids = new Set(
      enabledProjects.map((project) => project.asanaProjectGid),
    );

    const enrichedTasks = collection.tasks.map((task) => {
      const eligibleMemberships = (task.memberships ?? [])
        .filter((membership) => {
          const membershipProjectGid =
            membership.project?.gid ?? "";

          return enabledProjectGids.has(membershipProjectGid);
        });

      const classification = classifyTaxReturnTask(task, season);
      const reportReadiness = evaluateReportReadiness({
        classification,
        task,
      });
      const asanaSectionName =
        classification.selectedSectionName ?? "No section";

      return {
        ...task,

        section: asanaSectionName,
        asanaSectionName,

        sourceProject: classification.selectedProjectGid
          ? {
              gid: classification.selectedProjectGid,
              name: classification.selectedProjectName,
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

        selectedSectionGid: classification.selectedSectionGid,
        pipelineStage: classification.clientStage,
        clientStage: classification.clientStage,
        progressPercent: classification.progressPercent,
        workflowType: classification.workflowType,
        mappingStatus: classification.mappingStatus,
        clientVisible: classification.clientVisible,
        isTaxReturn: classification.taxReturnEligible,
        belongsToSelectedSeason:
          classification.belongsToSelectedSeason,
        clientStatusEligible:
          classification.clientStatusEligible,
        exclusionReason: classification.exclusionReason,
        reportReadiness,
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
