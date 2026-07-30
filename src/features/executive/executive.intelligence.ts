import type {
  ExecutiveHealthStatus,
  ExecutiveInsight,
  ExecutiveIntelligence,
  ExecutivePipelineMetrics,
  ExecutivePrimaryBottleneck,
  ExecutiveStageMetric,
} from "./executive.types";

function roundPercentage(value: number): number {
  return Math.round(value * 10) / 10;
}

function calculatePercentage(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return roundPercentage((part / total) * 100);
}

function findPrimaryBottleneck(
  stages: ExecutiveStageMetric[],
  activeTaxReturns: number,
): ExecutivePrimaryBottleneck | null {
  const activeStages = stages
    .filter((stage) => stage.stage !== "Filed" && stage.total > 0)
    .sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }

      return a.order - b.order;
    });

  const bottleneck = activeStages[0];

  if (!bottleneck) {
    return null;
  }

  return {
    stage: bottleneck.stage,
    total: bottleneck.total,
    percentageOfActiveWorkload: calculatePercentage(
      bottleneck.total,
      activeTaxReturns,
    ),
  };
}

function buildOverdueInsight(
  pipeline: ExecutivePipelineMetrics,
): ExecutiveInsight | null {
  if (pipeline.overdueTaxReturns === 0) {
    return null;
  }

  const severity =
    pipeline.overdueTaxReturns >= 15 ? "critical" : "warning";

  return {
    id: "overdue-tax-returns",
    severity,
    title:
      severity === "critical"
        ? "Immediate overdue review required"
        : "Overdue returns need attention",
    summary: `${pipeline.overdueTaxReturns.toLocaleString()} active tax returns are past their current Asana due date.`,
    recommendation:
      "Review the overdue queue, confirm ownership, and reset due dates only when a documented dependency justifies the change.",
    metricValue: pipeline.overdueTaxReturns,
    metricLabel: "Overdue",
  };
}

function buildUnassignedInsight(
  pipeline: ExecutivePipelineMetrics,
): ExecutiveInsight | null {
  if (pipeline.unassignedTaxReturns === 0) {
    return null;
  }

  const severity =
    pipeline.unassignedTaxReturns >= 25
      ? "critical"
      : pipeline.unassignedTaxReturns >= 10
        ? "warning"
        : "info";

  return {
    id: "unassigned-tax-returns",
    severity,
    title:
      severity === "critical"
        ? "Large unassigned workload"
        : "Tax returns need ownership",
    summary: `${pipeline.unassignedTaxReturns.toLocaleString()} tax returns do not currently have an Asana assignee.`,
    recommendation:
      "Assign each return to a responsible team member before additional work enters the pipeline.",
    metricValue: pipeline.unassignedTaxReturns,
    metricLabel: "Unassigned",
  };
}

function buildClassificationInsight(
  pipeline: ExecutivePipelineMetrics,
): ExecutiveInsight | null {
  if (pipeline.unmappedRecords === 0) {
    return null;
  }

  return {
    id: "unmapped-records",
    severity: "warning",
    title: "Workflow classification review required",
    summary: `${pipeline.unmappedRecords.toLocaleString()} Asana records are in new, renamed, or unrecognized sections.`,
    recommendation:
      "Review the unmapped section list and classify only confirmed tax workflow sections before including them in executive metrics.",
    metricValue: pipeline.unmappedRecords,
    metricLabel: "Unmapped",
  };
}

function buildBottleneckInsight(
  bottleneck: ExecutivePrimaryBottleneck | null,
): ExecutiveInsight | null {
  if (!bottleneck) {
    return null;
  }

  const severity =
    bottleneck.percentageOfActiveWorkload >= 35
      ? "warning"
      : "info";

  let recommendation =
    "Review staffing, dependencies, and aging within this stage before adding more work.";

  if (bottleneck.stage === "Information Collection") {
    recommendation =
      "Prioritize client follow-up and confirm which document requests are blocking preparation.";
  }

  if (bottleneck.stage === "Accounting Preparation") {
    recommendation =
      "Review accounting dependencies and identify returns that can proceed with completed or partially completed books.";
  }

  if (bottleneck.stage === "Internal Review") {
    recommendation =
      "Review reviewer capacity and move completed reviews toward signature or filing.";
  }

  if (bottleneck.stage === "Signature") {
    recommendation =
      "Prioritize signature reminders and verify that authorization requests were delivered.";
  }

  return {
    id: "primary-bottleneck",
    severity,
    title: `Primary bottleneck: ${bottleneck.stage}`,
    summary: `${bottleneck.total.toLocaleString()} returns are currently in ${bottleneck.stage}, representing ${bottleneck.percentageOfActiveWorkload.toFixed(1)}% of the active workload.`,
    recommendation,
    metricValue: bottleneck.total,
    metricLabel: bottleneck.stage,
  };
}

function calculateHealthScore(
  pipeline: ExecutivePipelineMetrics,
): number {
  if (pipeline.totalTaxReturns === 0) {
    return 0;
  }

  const overdueRate = calculatePercentage(
    pipeline.overdueTaxReturns,
    pipeline.activeTaxReturns,
  );

  const unassignedRate = calculatePercentage(
    pipeline.unassignedTaxReturns,
    pipeline.totalTaxReturns,
  );

  const unmappedRate = calculatePercentage(
    pipeline.unmappedRecords,
    pipeline.totalAsanaRecords,
  );

  let score = 100;

  score -= Math.min(30, overdueRate * 1.5);
  score -= Math.min(25, unassignedRate);
  score -= Math.min(15, unmappedRate);
  score -= Math.max(0, 75 - pipeline.averageProgressPercent) * 0.5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getHealthStatus(
  score: number,
): ExecutiveHealthStatus {
  if (score < 50) {
    return "critical";
  }

  if (score < 70) {
    return "attention";
  }

  if (score < 85) {
    return "stable";
  }

  return "strong";
}

function buildSummary(
  pipeline: ExecutivePipelineMetrics,
  bottleneck: ExecutivePrimaryBottleneck | null,
  healthStatus: ExecutiveHealthStatus,
): string {
  const healthLanguage: Record<ExecutiveHealthStatus, string> = {
    critical:
      "The tax operation currently requires immediate management attention.",
    attention:
      "The tax operation is progressing, but several operational risks require management attention.",
    stable:
      "The tax operation is currently stable, with specific areas that should continue to be monitored.",
    strong:
      "The tax operation is currently performing strongly based on the available workflow data.",
  };

  const statements = [
    healthLanguage[healthStatus],
    `${pipeline.totalTaxReturns.toLocaleString()} tax returns are classified, with ${pipeline.activeTaxReturns.toLocaleString()} active and ${pipeline.filedTaxReturns.toLocaleString()} filed.`,
    `Average pipeline completion is ${pipeline.averageProgressPercent.toFixed(1)}%.`,
  ];

  if (bottleneck) {
    statements.push(
      `${bottleneck.stage} is the largest workload concentration with ${bottleneck.total.toLocaleString()} returns.`,
    );
  }

  if (pipeline.overdueTaxReturns > 0) {
    statements.push(
      `${pipeline.overdueTaxReturns.toLocaleString()} returns are overdue.`,
    );
  }

  if (pipeline.unassignedTaxReturns > 0) {
    statements.push(
      `${pipeline.unassignedTaxReturns.toLocaleString()} returns remain unassigned.`,
    );
  }

  return statements.join(" ");
}

function sortInsights(
  insights: ExecutiveInsight[],
): ExecutiveInsight[] {
  const severityOrder: Record<
    ExecutiveInsight["severity"],
    number
  > = {
    critical: 1,
    warning: 2,
    info: 3,
    positive: 4,
  };

  return [...insights].sort((a, b) => {
    const severityDifference =
      severityOrder[a.severity] - severityOrder[b.severity];

    if (severityDifference !== 0) {
      return severityDifference;
    }

    return b.metricValue - a.metricValue;
  });
}

export function buildExecutiveIntelligence(
  pipeline: ExecutivePipelineMetrics,
  stages: ExecutiveStageMetric[],
): ExecutiveIntelligence {
  const primaryBottleneck = findPrimaryBottleneck(
    stages,
    pipeline.activeTaxReturns,
  );

  const healthScore = calculateHealthScore(pipeline);
  const healthStatus = getHealthStatus(healthScore);

  const priorityActions = sortInsights(
    [
      buildOverdueInsight(pipeline),
      buildUnassignedInsight(pipeline),
      buildClassificationInsight(pipeline),
      buildBottleneckInsight(primaryBottleneck),
    ].filter((insight): insight is ExecutiveInsight =>
      Boolean(insight),
    ),
  );

  if (priorityActions.length === 0) {
    priorityActions.push({
      id: "healthy-operation",
      severity: "positive",
      title: "No immediate operational exceptions",
      summary:
        "No overdue, unassigned, or unmapped tax workflow exceptions were detected.",
      recommendation:
        "Continue monitoring workload distribution and pipeline movement.",
      metricValue: healthScore,
      metricLabel: "Health Score",
    });
  }

  return {
    healthStatus,
    healthScore,
    summary: buildSummary(
      pipeline,
      primaryBottleneck,
      healthStatus,
    ),
    primaryBottleneck,
    priorityActions,
  };
}