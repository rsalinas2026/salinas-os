import type {
  RcbsClientStage,
  WorkflowType,
} from "@/features/tax-pipeline/progress/types";

export type ExecutiveInsightSeverity =
  | "critical"
  | "warning"
  | "info"
  | "positive";

export type ExecutiveHealthStatus =
  | "critical"
  | "attention"
  | "stable"
  | "strong";

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

export interface ExecutivePrimaryBottleneck {
  stage: RcbsClientStage;
  total: number;
  percentageOfActiveWorkload: number;
}

export interface ExecutiveInsight {
  id: string;
  severity: ExecutiveInsightSeverity;
  title: string;
  summary: string;
  recommendation: string;
  metricValue: number;
  metricLabel: string;
}

export interface ExecutiveIntelligence {
  healthStatus: ExecutiveHealthStatus;
  healthScore: number;
  summary: string;
  primaryBottleneck: ExecutivePrimaryBottleneck | null;
  priorityActions: ExecutiveInsight[];
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
  intelligence: ExecutiveIntelligence;

  generatedAt: string;
}