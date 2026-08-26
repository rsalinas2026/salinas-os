import { calculateProgress } from "./progress/calculate-progress";
import type {
  MappingStatus,
  RcbsClientStage,
  WorkflowType,
} from "./progress/types";
import {
  getEnabledSeasonProjects,
  type TaxSeason,
  type TaxSeasonProject,
} from "./tax-season-domain";

export type TaxReturnExclusionReason =
  | "outside-selected-season"
  | "missing-section"
  | "unmapped-section"
  | "non-tax-record"
  | "client-invisible";

export interface TaxReturnClassification {
  selectedProjectGid: string | null;
  selectedProjectName: string | null;
  selectedSectionGid: string | null;
  selectedSectionName: string | null;
  taxReturnEligible: boolean;
  clientVisible: boolean;
  clientStage: RcbsClientStage;
  progressPercent: number;
  workflowType: WorkflowType;
  mappingStatus: MappingStatus;
  exclusionReason: TaxReturnExclusionReason | null;
  belongsToSelectedSeason: boolean;
  clientStatusEligible: boolean;
}

export interface ClassifiableAsanaMembership {
  project?: {
    gid: string;
    name: string;
  } | null;
  section?: {
    gid: string;
    name: string;
  } | null;
}

export interface ClassifiableAsanaTask {
  memberships?: ClassifiableAsanaMembership[];
}

interface ClassificationCandidate {
  membership: ClassifiableAsanaMembership;
  project: TaxSeasonProject;
  projectOrder: number;
  progress: ReturnType<typeof calculateProgress>;
}

function compareStableText(left: string | undefined, right: string | undefined) {
  return (left ?? "").localeCompare(right ?? "");
}

function compareCandidates(
  left: ClassificationCandidate,
  right: ClassificationCandidate,
): number {
  if (left.progress.isTaxReturn !== right.progress.isTaxReturn) {
    return Number(right.progress.isTaxReturn) - Number(left.progress.isTaxReturn);
  }

  if (left.progress.mappingStatus !== right.progress.mappingStatus) {
    return left.progress.mappingStatus === "mapped" ? -1 : 1;
  }

  if (left.progress.progressPercent !== right.progress.progressPercent) {
    return right.progress.progressPercent - left.progress.progressPercent;
  }

  if (left.projectOrder !== right.projectOrder) {
    return left.projectOrder - right.projectOrder;
  }

  const sectionGidDifference = compareStableText(
    left.membership.section?.gid,
    right.membership.section?.gid,
  );

  if (sectionGidDifference !== 0) {
    return sectionGidDifference;
  }

  return compareStableText(
    left.membership.project?.gid,
    right.membership.project?.gid,
  );
}

function excludedOutsideSeason(): TaxReturnClassification {
  return {
    selectedProjectGid: null,
    selectedProjectName: null,
    selectedSectionGid: null,
    selectedSectionName: null,
    taxReturnEligible: false,
    clientVisible: false,
    clientStage: "Status Under Review",
    progressPercent: 0,
    workflowType: "unknown",
    mappingStatus: "unmapped",
    exclusionReason: "outside-selected-season",
    belongsToSelectedSeason: false,
    clientStatusEligible: false,
  };
}

/**
 * Canonically classifies an Asana task within one selected Tax Season.
 *
 * Every consumer must use this result instead of selecting an Asana
 * membership independently. Excluded records fail closed with a reason.
 */
export function classifyTaxReturnTask(
  task: ClassifiableAsanaTask,
  season: TaxSeason,
): TaxReturnClassification {
  const enabledProjects = getEnabledSeasonProjects(season);
  const projectsByGid = new Map(
    enabledProjects.map((project, projectOrder) => [
      project.asanaProjectGid,
      { project, projectOrder },
    ]),
  );

  const candidates: ClassificationCandidate[] = [];

  for (const membership of task.memberships ?? []) {
    const projectGid = membership.project?.gid;
    const configuredProject = projectGid
      ? projectsByGid.get(projectGid)
      : undefined;

    if (!configuredProject) {
      continue;
    }

    const sectionName = membership.section?.name?.trim() ?? "";

    candidates.push({
      membership,
      project: configuredProject.project,
      projectOrder: configuredProject.projectOrder,
      progress: calculateProgress(sectionName || "No section"),
    });
  }

  const selected = [...candidates].sort(compareCandidates)[0];

  if (!selected) {
    return excludedOutsideSeason();
  }

  const selectedSectionName = selected.membership.section?.name?.trim() || null;
  const selectedProjectGid = selected.membership.project?.gid ??
    selected.project.asanaProjectGid;
  const selectedProjectName = selected.membership.project?.name?.trim() ||
    selected.project.name;

  let exclusionReason: TaxReturnExclusionReason | null = null;

  if (!selectedSectionName) {
    exclusionReason = "missing-section";
  } else if (selected.progress.mappingStatus === "unmapped") {
    exclusionReason = "unmapped-section";
  } else if (!selected.progress.isTaxReturn) {
    exclusionReason = "non-tax-record";
  } else if (!selected.progress.clientVisible) {
    exclusionReason = "client-invisible";
  }

  return {
    selectedProjectGid,
    selectedProjectName,
    selectedSectionGid: selected.membership.section?.gid ?? null,
    selectedSectionName,
    taxReturnEligible: selected.progress.isTaxReturn,
    clientVisible: selected.progress.clientVisible,
    clientStage: selected.progress.clientStage,
    progressPercent: selected.progress.progressPercent,
    workflowType: selected.progress.workflowType,
    mappingStatus: selected.progress.mappingStatus,
    exclusionReason,
    belongsToSelectedSeason: true,
    clientStatusEligible: exclusionReason === null,
  };
}
