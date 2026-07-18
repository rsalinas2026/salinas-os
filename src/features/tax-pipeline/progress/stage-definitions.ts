import type { RcbsClientStage } from "./types";

export const RCBS_STAGES: Record<
  RcbsClientStage,
  {
    progress: number;
    order: number;
  }
> = {
  "Initial Review": {
    progress: 10,
    order: 1,
  },

  "Information Collection": {
    progress: 25,
    order: 2,
  },

  "Accounting Preparation": {
    progress: 40,
    order: 3,
  },

  "Tax Preparation": {
    progress: 60,
    order: 4,
  },

  "Internal Review": {
    progress: 75,
    order: 5,
  },

  Signature: {
    progress: 90,
    order: 6,
  },

  "Filing in Progress": {
    progress: 95,
    order: 7,
  },

  Filed: {
    progress: 100,
    order: 8,
  },

  "Status Under Review": {
    progress: 0,
    order: 999,
  },
};