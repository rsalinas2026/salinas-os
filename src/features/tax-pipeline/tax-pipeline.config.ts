import type { TaxPipelineStage } from "./tax-pipeline.types";

export interface TaxPipelineStageConfig {
  key: TaxPipelineStage;
  label: string;
  order: number;
}

export const TAX_PIPELINE_STAGES: TaxPipelineStageConfig[] = [
  {
    key: "prescreening",
    label: "Prescreening",
    order: 1,
  },
  {
    key: "information-requested",
    label: "Information Requested",
    order: 2,
  },
  {
    key: "work-in-progress",
    label: "Work in Progress",
    order: 3,
  },
  {
    key: "in-review",
    label: "In Review",
    order: 4,
  },
  {
    key: "waiting-for-signature",
    label: "Waiting for Signature",
    order: 5,
  },
  {
    key: "ready-to-file",
    label: "Ready to File",
    order: 6,
  },
  {
    key: "sent-to-irs",
    label: "Sent to IRS",
    order: 7,
  },
  {
    key: "completed",
    label: "Completed",
    order: 8,
  },
];

export const TAX_PIPELINE_SETTINGS = {
  staleAfterDays: 7,
};