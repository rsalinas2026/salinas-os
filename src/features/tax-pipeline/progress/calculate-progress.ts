import { SECTION_PROGRESS_MAPPINGS } from "./section-mapping";
import { RCBS_STAGES } from "./stage-definitions";
import type { ProgressResult } from "./types";

export function calculateProgress(
  asanaSectionName: string,
): ProgressResult {
  const mapping = SECTION_PROGRESS_MAPPINGS[asanaSectionName];

  if (!mapping) {
    console.warn(
      `[Progress Engine] Unmapped Asana section: ${asanaSectionName}`,
    );

    return {
      asanaSectionName,
      clientStage: "Status Under Review",
      progressPercent: 0,
      clientVisible: false,
      workflowType: "unknown",
      mappingStatus: "unmapped",
      isTaxReturn: false,
    };
  }

  const stage = RCBS_STAGES[mapping.clientStage];

  return {
    asanaSectionName,
    clientStage: mapping.clientStage,
    progressPercent: stage.progress,
    clientVisible: mapping.clientVisible,
    workflowType: mapping.workflowType ?? "unknown",
    mappingStatus: "mapped",
    isTaxReturn: mapping.isTaxReturn,
  };
}