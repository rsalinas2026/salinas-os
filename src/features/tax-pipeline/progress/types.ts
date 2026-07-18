export type RcbsClientStage =
  | "Initial Review"
  | "Information Collection"
  | "Accounting Preparation"
  | "Tax Preparation"
  | "Internal Review"
  | "Signature"
  | "Filing in Progress"
  | "Filed"
  | "Status Under Review";

export type WorkflowType =
  | "standard-tax"
  | "tax-with-accounting"
  | "tax-with-bookkeeping"
  | "unknown";

export type MappingStatus = "mapped" | "unmapped";

export interface SectionProgressMapping {
  asanaSectionName: string;
  clientStage: RcbsClientStage;
  clientVisible: boolean;
  workflowType?: WorkflowType;

  /**
   * Determines whether tasks in this Asana section should be counted
   * as tax returns in Salinas OS operational metrics.
   */
  isTaxReturn: boolean;
}

export interface ProgressResult {
  asanaSectionName: string;
  clientStage: RcbsClientStage;
  progressPercent: number;
  clientVisible: boolean;
  workflowType: WorkflowType;
  mappingStatus: MappingStatus;

  /**
   * True when the record belongs to the active tax-return workflow.
   * False for leads, administrative tasks, questionnaires and other
   * non-return records.
   */
  isTaxReturn: boolean;
}