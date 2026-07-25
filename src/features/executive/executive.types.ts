import type {
  RcbsClientStage,
  WorkflowType,
} from "@/features/tax-pipeline/progress/types";

export interface ExecutiveStageMetric {
  stage: RcbsClientStage;
  order: number;
  progressPercent: number;
  total: number;
  active: number;
  completed: number;
  percentageOfPipeline: number;
}

export interface ExecutiveWorkflowMetric {
  workflowType: WorkflowType;
  total: number;
  percentageOfPipeline: number;
}

export interface ExecutiveUnmappedSectionMetric {
  sectionName: string;
  total: number;
}

export interface ExecutivePipelineMetrics {
  totalAsanaRecords: number;

  totalTaxReturns: number;
  activeTaxReturns: number;
  filedTaxReturns: number;

  mappedNonTaxRecords: number;
  unmappedRecords: number;
  excludedRecords: number;

  assignedTaxReturns: number;
  unassignedTaxReturns: number;

  overdueTaxReturns: number;
  averageProgressPercent: number;
}

export interface ExecutiveProjectMetric {
  projectGid: string;
  projectName: string;
  totalRecords: number;
}

export interface ExecutiveDashboardData {
  season: {
    id: string;
    year: number;
    name: string;
    status: string;
  };

  pipeline: ExecutivePipelineMetrics;
  stages: ExecutiveStageMetric[];
  workflows: ExecutiveWorkflowMetric[];
  projects: ExecutiveProjectMetric[];
  unmappedSections: ExecutiveUnmappedSectionMetric[];

  generatedAt: string;
}