export interface ClientPortalProgress {
  progressPercent: number;
  stage: string;
  headline: string;
  description: string;
  nextStep: string;
  clientActionRequired: boolean;
  clientActionMessage: string;
}

export interface ClientPortalStage {
  name: string;
  progress: number;
}

export interface ClientPortalSummary {
  form: string;
  taxYear: string;
  updatedDate: string;
  completedMilestones: number;
  totalMilestones: number;
}

export interface ClientPortalClient {
  gid: string;
  name: string;
}

export interface ClientPortalEstimate {
  label: string;
  disclaimer: string;
}

export interface ClientPortalData {
  client: ClientPortalClient;
  progress: ClientPortalProgress;
  summary: ClientPortalSummary;
  estimate: ClientPortalEstimate;
}