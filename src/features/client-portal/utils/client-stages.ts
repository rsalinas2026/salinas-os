import type { ClientPortalStage } from "../types";

export const CLIENT_PORTAL_STAGES: ClientPortalStage[] = [
  {
    name: "Initial Review",
    progress: 10,
  },
  {
    name: "Information Collection",
    progress: 25,
  },
  {
    name: "Accounting Preparation",
    progress: 40,
  },
  {
    name: "Tax Preparation",
    progress: 60,
  },
  {
    name: "Internal Review",
    progress: 75,
  },
  {
    name: "Signature",
    progress: 90,
  },
  {
    name: "Filing in Progress",
    progress: 95,
  },
  {
    name: "Filed",
    progress: 100,
  },
];

export function getCurrentStageIndex(stageName: string): number {
  return CLIENT_PORTAL_STAGES.findIndex(
    (stage) => stage.name === stageName,
  );
}

export function getCompletedMilestoneCount(stageName: string): number {
  const currentStageIndex = getCurrentStageIndex(stageName);

  if (currentStageIndex < 0) {
    return 0;
  }

  return currentStageIndex;
}

export function getCurrentTimelineStage(
  currentProgress: number,
): ClientPortalStage | null {
  const exactStage = CLIENT_PORTAL_STAGES.find(
    (stage) => stage.progress === currentProgress,
  );

  if (exactStage) {
    return exactStage;
  }

  const nextStage = CLIENT_PORTAL_STAGES.find(
    (stage) => stage.progress > currentProgress,
  );

  if (!nextStage) {
    return CLIENT_PORTAL_STAGES.at(-1) ?? null;
  }

  const nextStageIndex = CLIENT_PORTAL_STAGES.findIndex(
    (stage) => stage.name === nextStage.name,
  );

  if (nextStageIndex <= 0) {
    return CLIENT_PORTAL_STAGES[0] ?? null;
  }

  return CLIENT_PORTAL_STAGES[nextStageIndex - 1] ?? null;
}

export function isTimelineStageCompleted(
  stageProgress: number,
  currentProgress: number,
): boolean {
  return currentProgress >= stageProgress;
}