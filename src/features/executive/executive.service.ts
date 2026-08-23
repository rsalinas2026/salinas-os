import {
  classifyTaxReturnTask,
  type TaxReturnClassification,
} from "@/features/tax-pipeline/classify-tax-return";
import { RCBS_STAGES } from "@/features/tax-pipeline/progress/stage-definitions";
import type {
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
import { buildExecutiveIntelligence } from "./executive.intelligence";
import type {
  ExecutiveDashboardData,
  ExecutivePipelineMetrics,
  ExecutiveProjectMetric,
  ExecutiveStageMetric,
  ExecutiveUnmappedSectionMetric,
  ExecutiveWorkflowMetric,
} from "./executive.types";

type TaskClassification = {
  task: AsanaTask;
  classification: TaxReturnClassification;
};

const CLIENT_STAGES = Object.keys(
  RCBS_STAGES,
) as RcbsClientStage[];

const WORKFLOW_TYPES: WorkflowType[] = [
  "standard-tax",
  "tax-with-accounting",
  "tax-with-bookkeeping",
  "unknown",
];

function roundPercentage(value: number): number {
  return Math.round(value * 10) / 10;
}

function calculatePercentage(
  part: number,
  total: number,
): number {
  if (total === 0) {
    return 0;
  }

  return roundPercentage((part / total) * 100);
}

function buildStageMetrics(
  taxReturns: TaskClassification[],
): ExecutiveStageMetric[] {
  return CLIENT_STAGES.map((stage) => {
    const stageDefinition = RCBS_STAGES[stage];

    const stageItems = taxReturns.filter(
      (item) => item.classification.clientStage === stage,
    );

    const completed =
      stage === "Filed"
        ? stageItems.length
        : stageItems.filter(
            (item) => item.task.completed === true,
          ).length;

    return {
      stage,
      order: stageDefinition.order,
      progressPercent: stageDefinition.progress,
      total: stageItems.length,
      active: Math.max(
        stageItems.length - completed,
        0,
      ),
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
      (item) =>
        item.classification.workflowType === workflowType,
    ).length;

    return {
      workflowType,
      total,
      percentageOfPipeline: calculatePercentage(
        total,
        taxReturns.length,
      ),
    };
  }).filter((metric) => metric.total > 0);
}

function buildUnmappedSectionMetrics(
  classifiedTasks: TaskClassification[],
): ExecutiveUnmappedSectionMetric[] {
  const counts = new Map<string, number>();

  for (const item of classifiedTasks) {
    const isUnmapped =
      item.classification.mappingStatus === "unmapped";

    if (!isUnmapped) {
      continue;
    }

    const sectionName =
      item.classification.selectedSectionName ?? "No Asana Section";

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
          membership.project?.gid ===
          project.asanaProjectGid,
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
    (sum, item) =>
      sum + item.classification.progressPercent,
    0,
  );

  return roundPercentage(
    totalProgress / taxReturns.length,
  );
}

function isTaskOverdue(
  task: AsanaTask,
  now: Date,
): boolean {
  if (!task.due_on || task.completed) {
    return false;
  }

  const dueDate = new Date(
    `${task.due_on}T23:59:59`,
  );

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
    ({
      task,
      classification: classifyTaxReturnTask(task, season),
    }),
  );

  const taxReturns = classifiedTasks.filter(
    (item) => item.classification.taxReturnEligible,
  );

  const mappedNonTaxRecords = classifiedTasks.filter(
    (item) =>
      item.classification.mappingStatus === "mapped" &&
      !item.classification.taxReturnEligible,
  ).length;

  const unmappedRecords = classifiedTasks.filter(
    (item) =>
      item.classification.mappingStatus === "unmapped",
  ).length;

  const filedTaxReturns = taxReturns.filter(
    (item) => item.classification.clientStage === "Filed",
  ).length;

  const activeTaxReturns = Math.max(
    taxReturns.length - filedTaxReturns,
    0,
  );

  const assignedTaxReturns = taxReturns.filter((item) =>
    Boolean(item.task.assignee),
  ).length;

  const unassignedTaxReturns = Math.max(
    taxReturns.length - assignedTaxReturns,
    0,
  );

  const overdueTaxReturns = taxReturns.filter((item) =>
    isTaskOverdue(item.task, now),
  ).length;

  const averageProgressPercent =
    getAverageProgress(taxReturns);

  const pipeline: ExecutivePipelineMetrics = {
    totalAsanaRecords: collection.tasks.length,

    totalTaxReturns: taxReturns.length,
    activeTaxReturns,
    filedTaxReturns,

    mappedNonTaxRecords,
    unmappedRecords,
    excludedRecords:
      mappedNonTaxRecords + unmappedRecords,

    assignedTaxReturns,
    unassignedTaxReturns,

    overdueTaxReturns,
    averageProgressPercent,
  };

  const stages = buildStageMetrics(taxReturns);

  const workflows = buildWorkflowMetrics(taxReturns);

  const projects = buildProjectMetrics(
    collection.tasks,
    collection.projects,
  );

  const unmappedSections =
    buildUnmappedSectionMetrics(classifiedTasks);

  const intelligence = buildExecutiveIntelligence(
    pipeline,
    stages,
  );

  return {
    season: {
      id: season.id,
      year: season.year,
      name: season.name,
      status: season.status,
    },

    pipeline,
    stages,
    workflows,
    projects,
    unmappedSections,
    intelligence,

    generatedAt: now.toISOString(),
  };
}
