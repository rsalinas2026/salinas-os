import { NextResponse } from "next/server";
import { getAllProjectTasks } from "@/features/tax-pipeline/tax-pipeline.service";
import { calculateProgress } from "@/features/tax-pipeline/progress/calculate-progress";

export async function GET() {
  try {
    const projectGid = process.env.ASANA_PROJECT_GID;

    if (!projectGid) {
      throw new Error("Missing ASANA_PROJECT_GID in .env.local");
    }

    const tasks = await getAllProjectTasks();

    const enrichedTasks = tasks.map((task) => {
      const projectMembership = task.memberships?.find(
        (membership) => membership.project?.gid === projectGid,
      );

      const asanaSectionName =
        projectMembership?.section?.name ?? "No section";

      const progress = calculateProgress(asanaSectionName);

      return {
        ...task,
        section: asanaSectionName,
        asanaSectionName,
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
      counts: {
        allRecords: enrichedTasks.length,
        taxReturns: taxReturns.length,
        nonTaxRecords: nonTaxRecords.length,
        mapped: enrichedTasks.length - unmappedRecords.length,
        unmapped: unmappedRecords.length,
      },
      tasks: enrichedTasks,
      taxReturns,
      nonTaxRecords,
      unmappedRecords,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Asana error";

    console.error("Failed to load tax returns:", error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}