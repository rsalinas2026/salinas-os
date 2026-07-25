import { calculateProgress } from "@/features/tax-pipeline/progress/calculate-progress";
import { RCBS_STAGES } from "@/features/tax-pipeline/progress/stage-definitions";
import type {
  ProgressResult,
  RcbsClientStage,
  WorkflowType,
} from "@/features/tax-pipeline/progress/types";
import {
  getTaxSeasonTasks,
  type AsanaTask,
} from "@/features/tax-pipeline/tax-pipeline.service";
import {
  resolveTaxSeason,
  type TaxSeason,
  type TaxSeasonProject,
} from "@/features/tax-pipeline/tax-seasons";
import type {
  ExecutiveDashboardData,
  ExecutiveProjectMetric,
  ExecutiveStageMetric,
  ExecutiveUnmappedSectionMetric,
  ExecutiveWorkflowMetric,
} from "./executive.types";

type TaskClassification = {
  task: AsanaTask;
  sectionName: string | null;
  progress: ProgressResult | null;
};

const CLIENT_STAGES = Object.keys(RCBS_STAGES) as RcbsClientStage[];

const WORKFLOW_TYPES: WorkflowType[] = [
  "standard-tax",
  "tax-with-accounting",
  "tax-with-bookkeeping",
  "unknown",
];

function roundPercentage(value: number): number {
  return Math.round(value * 10) / 10;
}

function calculatePercentage(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return roundPercentage((part / total) * 100);
}

function getSeasonMemberships(
  task: AsanaTask,
  projects: TaxSeasonProject[],
): NonNullable<AsanaTask["memberships"]> {
  const projectGids = new Set(
    projects.map((project) => project.asanaProjectGid),
  );

  return (task.memberships ?? []).filter((membership) => {
    const projectGid = membership.project?.gid;

    return Boolean(projectGid && projectGids.has(projectGid));
  });
}

/**
 * A task may belong to more than one enabled Asana project.
 *
 * When multiple eligible section memberships exist, the membership with the
 * highest progress is used as the task's current operational classification.
 * This prevents duplicate counting while favoring the most advanced mapped
 * workflow position.
 */
function classifyTask(
  task: AsanaTask,
  projects: TaxSeasonProject[],
): TaskClassification {
  const memberships = getSeasonMemberships(task, projects);

  const sectionCandidates = memberships
    .map((membership) => membership.section?.name?.trim())
    .filter((sectionName): sectionName is string => Boolean(sectionName))
    .map((sectionName) => ({
      sectionName,
      progress: calculateProgress(sectionName),
    }));

  if (sectionCandidates.length === 0) {
    return {
      task,
      sectionName: null,
      progress: null,
    };
  }

  const rankedCandidates = [...sectionCandidates].sort((a, b) => {
    if (a.progress.isTaxReturn !== b.progress.isTaxReturn) {
      return Number(b.progress.isTaxReturn) - Number(a.progress.isTaxReturn);
    }

    if (a.progress.mappingStatus !== b.progress.mappingStatus) {
      return a.progress.mappingStatus === "mapped" ? -1 : 1;
    }

    return b.progress.progressPercent - a.progress.progressPercent;
  });

  const selectedCandidate = rankedCandidates[0];

  return {
    task,
    sectionName: selectedCandidate.sectionName,
    progress: selectedCandidate.progress,
  };
}

function buildStageMetrics(
  taxReturns: TaskClassification[],
): ExecutiveStageMetric[] {
  return CLIENT_STAGES.map((stage) => {
    const stageDefinition = RCBS_STAGES[stage];
    const stageItems = taxReturns.filter(
      (item) => item.progress?.clientStage === stage,
    );

    const completed =
      stage === "Filed"
        ? stageItems.length
        : stageItems.filter((item) => item.task.completed === true).length;

    return {
      stage,
      order: stageDefinition.order,
      progressPercent: stageDefinition.progress,
      total: stageItems.length,
      active: Math.max(stageItems.length - completed, 0),
      completed,
      percentageOfPipeline: calculatePercentage(
        stageItems.length,
        taxReturns.length,
      ),
    };
  })
    .filter((metric) => metric.total > 0)
    .sort((a, b) => a.order - b.order);
}

function buildWorkflowMetrics(
  taxReturns: TaskClassification[],
): ExecutiveWorkflowMetric[] {
  return WORKFLOW_TYPES.map((workflowType) => {
    const total = taxReturns.filter(
      (item) => item.progress?.workflowType === workflowType,
    ).length;

    return {
      workflowType,
      total,
      percentageOfPipeline: calculatePercentage(total, taxReturns.length),
    };
  }).filter((metric) => metric.total > 0);
}

function buildUnmappedSectionMetrics(
  classifiedTasks: TaskClassification[],
): ExecutiveUnmappedSectionMetric[] {
  const counts = new Map<string, number>();

  for (const item of classifiedTasks) {
    const isUnmapped =
      !item.progress || item.progress.mappingStatus === "unmapped";

    if (!isUnmapped) {
      continue;
    }

    const sectionName = item.sectionName ?? "No Asana Section";
    const currentCount = counts.get(sectionName) ?? 0;

    counts.set(sectionName, currentCount + 1);
  }

  return Array.from(counts.entries())
    .map(([sectionName, total]) => ({
      sectionName,
      total,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }

      return a.sectionName.localeCompare(b.sectionName);
    });
}

function buildProjectMetrics(
  tasks: AsanaTask[],
  projects: TaxSeasonProject[],
): ExecutiveProjectMetric[] {
  return projects.map((project) => {
    const totalRecords = tasks.filter((task) =>
      task.memberships?.some(
        (membership) =>
          membership.project?.gid === project.asanaProjectGid,
      ),
    ).length;

    return {
      projectGid: project.asanaProjectGid,
      projectName: project.name,
      totalRecords,
    };
  });
}

function getAverageProgress(
  taxReturns: TaskClassification[],
): number {
  if (taxReturns.length === 0) {
    return 0;
  }

  const totalProgress = taxReturns.reduce(
    (sum, item) => sum + (item.progress?.progressPercent ?? 0),
    0,
  );

  return roundPercentage(totalProgress / taxReturns.length);
}

function isTaskOverdue(task: AsanaTask, now: Date): boolean {
  if (!task.due_on || task.completed) {
    return false;
  }

  const dueDate = new Date(`${task.due_on}T23:59:59`);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return dueDate.getTime() < now.getTime();
}

export async function buildExecutiveDashboard(
  seasonId?: string | null,
): Promise<ExecutiveDashboardData> {
  const season: TaxSeason = resolveTaxSeason(seasonId);
  const collection = await getTaxSeasonTasks(season);
  const now = new Date();

  const classifiedTasks = collection.tasks.map((task) =>
    classifyTask(task, collection.projects),
  );

  const taxReturns = classifiedTasks.filter(
    (item) => item.progress?.isTaxReturn === true,
  );

  const mappedNonTaxRecords = classifiedTasks.filter(
    (item) =>
      item.progress?.mappingStatus === "mapped" &&
      item.progress.isTaxReturn === false,
  ).length;

  const unmappedRecords = classifiedTasks.filter(
    (item) =>
      !item.progress || item.progress.mappingStatus === "unmapped",
  ).length;

  const filedTaxReturns = taxReturns.filter(
    (item) => item.progress?.clientStage === "Filed",
  ).length;

  const activeTaxReturns = Math.max(
    taxReturns.length - filedTaxReturns,
    0,
  );

  const assignedTaxReturns = taxReturns.filter(
    (item) => Boolean(item.task.assignee),
  ).length;

  const overdueTaxReturns = taxReturns.filter((item) =>
    isTaskOverdue(item.task, now),
  ).length;

  return {
    season: {
      id: season.id,
      year: season.year,
      name: season.name,
      status: season.status,
    },

    pipeline: {
      totalAsanaRecords: collection.tasks.length,

      totalTaxReturns: taxReturns.length,
      activeTaxReturns,
      filedTaxReturns,

      mappedNonTaxRecords,
      unmappedRecords,
      excludedRecords: mappedNonTaxRecords + unmappedRecords,

      assignedTaxReturns,
      unassignedTaxReturns: Math.max(
        taxReturns.length - assignedTaxReturns,
        0,
      ),

      overdueTaxReturns,
      averageProgressPercent: getAverageProgress(taxReturns),
    },

    stages: buildStageMetrics(taxReturns),
    workflows: buildWorkflowMetrics(taxReturns),
    projects: buildProjectMetrics(
      collection.tasks,
      collection.projects,
    ),
    unmappedSections: buildUnmappedSectionMetrics(classifiedTasks),

    generatedAt: now.toISOString(),
  };
}
