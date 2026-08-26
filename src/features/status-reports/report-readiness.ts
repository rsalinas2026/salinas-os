import type { TaxReturnClassification } from "../tax-pipeline/classify-tax-return";

export type ReportReadinessCategory =
  | "candidate"
  | "attention-required"
  | "not-applicable";

export type ReportReadinessDecisionCode =
  | "canonical-blocked"
  | "active-assigned-return"
  | "filed-recurring-not-applicable"
  | "completed-state-review"
  | "missing-assignee";

export interface ReportReadinessTaskMetadata {
  completed?: boolean;
  assignee?: {
    gid: string;
    name: string;
  } | null;
  due_on?: string | null;
}

export interface ReportReadinessResult {
  category: ReportReadinessCategory | null;
  weeklyReportCandidate: boolean;
  explanation: string;
  decisionCode: ReportReadinessDecisionCode;
  businessPolicyRequired: boolean;
}

export interface ReportReadinessInput {
  classification: TaxReturnClassification;
  task: ReportReadinessTaskMetadata;
}

/**
 * Applies deterministic weekly-report readiness after canonical eligibility.
 *
 * This layer does not decide tax-return eligibility. Filed/100% returns remain
 * eligible for status preview but are not applicable to recurring reporting.
 */
export function evaluateReportReadiness({
  classification,
  task,
}: ReportReadinessInput): ReportReadinessResult {
  if (!classification.clientStatusEligible) {
    return {
      category: null,
      weeklyReportCandidate: false,
      explanation: "Canonical client-status eligibility is required.",
      decisionCode: "canonical-blocked",
      businessPolicyRequired: false,
    };
  }

  if (
    classification.clientStage === "Filed" ||
    classification.progressPercent === 100
  ) {
    return {
      category: "not-applicable",
      weeklyReportCandidate: false,
      explanation:
        "Return is filed / 100% complete — recurring weekly reporting is no longer applicable.",
      decisionCode: "filed-recurring-not-applicable",
      businessPolicyRequired: false,
    };
  }

  if (task.completed === true) {
    return {
      category: "attention-required",
      weeklyReportCandidate: false,
      explanation:
        "Asana task is completed before the Filed stage — staff review required.",
      decisionCode: "completed-state-review",
      businessPolicyRequired: false,
    };
  }

  if (!task.assignee) {
    return {
      category: "attention-required",
      weeklyReportCandidate: false,
      explanation: "No Asana assignee — staff review recommended.",
      decisionCode: "missing-assignee",
      businessPolicyRequired: false,
    };
  }

  return {
    category: "candidate",
    weeklyReportCandidate: true,
    explanation: "Active assigned return in the client-facing workflow.",
    decisionCode: "active-assigned-return",
    businessPolicyRequired: false,
  };
}
