import type {
  ClientPortalEstimate,
  ClientPortalProgress,
} from "../types";

type CompletionWindowRule = {
  minimumProgress: number;
  label: string;
};

const COMPLETION_WINDOW_RULES: CompletionWindowRule[] = [
  {
    minimumProgress: 100,
    label: "Completed",
  },
  {
    minimumProgress: 95,
    label: "Typically within several business days",
  },
  {
    minimumProgress: 90,
    label: "Typically within 1–2 weeks",
  },
  {
    minimumProgress: 75,
    label: "Typically within 2–3 weeks",
  },
  {
    minimumProgress: 60,
    label: "Typically within 3–5 weeks",
  },
  {
    minimumProgress: 40,
    label: "Typically within 4–6 weeks",
  },
  {
    minimumProgress: 25,
    label: "Timing depends on receipt of required information",
  },
  {
    minimumProgress: 0,
    label: "Timing will become clearer as the review progresses",
  },
];

const STANDARD_DISCLAIMER =
  "This is a general planning window based on the current workflow stage. It is not a promised completion or filing date. Timing may change based on document availability, client response time, return complexity, quality-control findings, government processing requirements, and other circumstances.";

const ACTION_REQUIRED_DISCLAIMER =
  "This planning window assumes the requested information is provided promptly. It is not a promised completion or filing date. Delays in receiving complete information may extend the timeline.";

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function getEstimatedCompletionWindow(
  progress: ClientPortalProgress,
): ClientPortalEstimate {
  const progressPercent = clampProgress(progress.progressPercent);

  const matchingRule =
    COMPLETION_WINDOW_RULES.find(
      (rule) => progressPercent >= rule.minimumProgress,
    ) ?? COMPLETION_WINDOW_RULES[COMPLETION_WINDOW_RULES.length - 1];

  if (progressPercent >= 100) {
    return {
      label: matchingRule.label,
      disclaimer:
        "The RCBS workflow reflects this return as completed. Government acceptance, notices, refunds, payments, and processing timelines remain outside RCBS control.",
    };
  }

  return {
    label: matchingRule.label,
    disclaimer: progress.clientActionRequired
      ? ACTION_REQUIRED_DISCLAIMER
      : STANDARD_DISCLAIMER,
  };
}