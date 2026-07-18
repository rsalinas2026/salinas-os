export type TaxPipelineStage =
  | "prescreening"
  | "information-requested"
  | "work-in-progress"
  | "in-review"
  | "waiting-for-signature"
  | "ready-to-file"
  | "sent-to-irs"
  | "completed"
  | "unknown";

export interface TaxPipelineAssignee {
  gid: string;
  name: string;
  email?: string | null;
}

export interface TaxPipelineClient {
  gid: string;
  name: string;
}

export interface TaxPipelineItem {
  gid: string;
  name: string;
  client: TaxPipelineClient | null;
  stage: TaxPipelineStage;
  stageLabel: string;
  assignee: TaxPipelineAssignee | null;

  completed: boolean;
  overdue: boolean;

  dueDate: string | null;
  createdAt: string | null;
  modifiedAt: string | null;
  completedAt: string | null;

  daysInCurrentStage: number | null;
  daysSinceLastActivity: number | null;

  asanaUrl: string | null;
}

export interface TaxPipelineStageSummary {
  stage: TaxPipelineStage;
  label: string;
  count: number;
  percentage: number;
  overdueCount: number;
  unassignedCount: number;
}

export interface TaxPipelineAssigneeSummary {
  assignee: TaxPipelineAssignee;
  total: number;
  overdue: number;
  stages: Partial<Record<TaxPipelineStage, number>>;
}

export interface TaxPipelineSummary {
  projectGid: string;
  projectName: string;

  generatedAt: string;

  total: number;
  active: number;
  completed: number;
  overdue: number;
  unassigned: number;
  stale: number;

  stages: TaxPipelineStageSummary[];
  assignees: TaxPipelineAssigneeSummary[];
}

export interface TaxPipelineDashboardData {
  summary: TaxPipelineSummary;
  items: TaxPipelineItem[];
}