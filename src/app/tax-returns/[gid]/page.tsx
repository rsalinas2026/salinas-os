import Link from "next/link";
import { notFound } from "next/navigation";
import { asanaFetch } from "@/lib/asana/asana-client";
import { classifyTaxReturnTask } from "@/features/tax-pipeline/classify-tax-return";
import { getClientStatus } from "@/features/tax-pipeline/progress/client-status";
import { resolveTaxSeason } from "@/features/tax-pipeline/tax-seasons";
import { ClientActionPanel } from "@/features/client-portal/components/ClientActionPanel";
import { EstimatedCompletionCard } from "@/features/client-portal/components/EstimatedCompletionCard";
import { HeroProgress } from "@/features/client-portal/components/HeroProgress";
import { MilestonesCard } from "@/features/client-portal/components/MilestonesCard";
import { NextStepCard } from "@/features/client-portal/components/NextStepCard";
import { PortalFooter } from "@/features/client-portal/components/PortalFooter";
import { PortalHeader } from "@/features/client-portal/components/PortalHeader";
import { PrintButton } from "@/features/client-portal/components/PrintButton";
import type {
  ClientPortalData,
  ClientPortalProgress,
} from "@/features/client-portal/types";
import { getEstimatedCompletionWindow } from "@/features/client-portal/utils/estimated-completion";
import {
  CLIENT_PORTAL_STAGES,
  getCompletedMilestoneCount,
} from "@/features/client-portal/utils/client-stages";

type AsanaResponse<T> = {
  data: T;
};

type AsanaEnumValue = {
  gid: string;
  name: string;
};

type AsanaCustomField = {
  gid: string;
  name: string;
  display_value?: string | null;
  text_value?: string | null;
  enum_value?: AsanaEnumValue | null;
};

type AsanaTask = {
  gid: string;
  name: string;
  completed: boolean;
  due_on?: string | null;
  modified_at?: string | null;

  assignee?: {
    gid: string;
    name: string;
  } | null;

  memberships?: Array<{
    project?: {
      gid: string;
      name: string;
    } | null;

    section?: {
      gid: string;
      name: string;
    } | null;
  }>;

  custom_fields?: AsanaCustomField[];
};

type TaxReturnStatusPageProps = {
  params: Promise<{
    gid: string;
  }>;

  searchParams?: Promise<{
    season?: string;
  }>;
};

function getCustomFieldValue(
  customFields: AsanaCustomField[] | undefined,
  fieldName: string,
): string | null {
  const field = customFields?.find(
    (item) => item.name.toLowerCase() === fieldName.toLowerCase(),
  );

  return (
    field?.display_value ??
    field?.enum_value?.name ??
    field?.text_value ??
    null
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function TaxReturnStatusPage({
  params,
  searchParams,
}: TaxReturnStatusPageProps) {
  const { gid } = await params;
  const resolvedSearchParams = searchParams
    ? await searchParams
    : undefined;

  /**
   * Supported examples:
   *
   * /tax-returns/123456
   * /tax-returns/123456?season=2026
   *
   * Without a season query parameter, Salinas OS uses the active season.
   */
  const season = resolveTaxSeason(resolvedSearchParams?.season);

  const taskFields = [
    "gid",
    "name",
    "completed",
    "due_on",
    "modified_at",
    "assignee.gid",
    "assignee.name",
    "memberships.project.gid",
    "memberships.project.name",
    "memberships.section.gid",
    "memberships.section.name",
    "custom_fields.name",
    "custom_fields.display_value",
    "custom_fields.text_value",
    "custom_fields.enum_value.name",
  ].join(",");

  const response = await asanaFetch<AsanaResponse<AsanaTask>>(
    `/tasks/${encodeURIComponent(gid)}?opt_fields=${encodeURIComponent(
      taskFields,
    )}`,
  );

  const task = response.data;

  const classification = classifyTaxReturnTask(task, season);

  if (!classification.clientStatusEligible) {
    notFound();
  }

  const clientStatus = getClientStatus(classification.clientStage);

  const form =
    getCustomFieldValue(task.custom_fields, "Form") ?? "Tax Return";

  const taxYear =
    getCustomFieldValue(task.custom_fields, "Tax Year") ??
    String(season.year - 1);

  const updatedDate = formatDate(task.modified_at);

  const completedMilestones = getCompletedMilestoneCount(
    clientStatus.stage,
  );

  const portalProgress: ClientPortalProgress = {
    progressPercent: clientStatus.progressPercent,
    stage: clientStatus.stage,
    headline: clientStatus.headline,
    description: clientStatus.description,
    nextStep: clientStatus.nextStep,
    clientActionRequired: clientStatus.clientActionRequired,
    clientActionMessage: clientStatus.clientActionMessage,
  };

  const portalData: ClientPortalData = {
    client: {
      gid: task.gid,
      name: task.name,
    },

    progress: portalProgress,

    summary: {
      form,
      taxYear,
      updatedDate,
      completedMilestones,
      totalMilestones: CLIENT_PORTAL_STAGES.length,
    },

    estimate: getEstimatedCompletionWindow(portalProgress),
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 print:min-h-0 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-5xl print:max-w-none">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <Link
              href={`/tax-returns?season=${season.id}`}
              className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
            >
              ← Back to Tax Returns
            </Link>

            <p className="mt-1 text-sm text-slate-500">
              Client Status Preview · {season.name}
            </p>
          </div>

          <PrintButton />
        </div>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
          <PortalHeader
            updatedDate={portalData.summary.updatedDate}
          />

          <div className="px-7 py-8 md:px-10 md:py-10 print:px-0 print:pb-0 print:pt-6">
            <section className="print:break-inside-avoid">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                {portalData.summary.taxYear} Tax Return Status
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                {portalData.client.name}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {portalData.summary.form}
                </span>

                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {portalData.progress.stage}
                </span>
              </div>
            </section>

            <HeroProgress progress={portalData.progress} />

            <MilestonesCard
              currentProgress={portalData.progress.progressPercent}
              currentStage={portalData.progress.stage}
              completedMilestones={
                portalData.summary.completedMilestones
              }
              totalMilestones={portalData.summary.totalMilestones}
            />

            <div className="mt-9 grid gap-6 md:grid-cols-2">
              <NextStepCard
                nextStep={portalData.progress.nextStep}
              />

              <ClientActionPanel progress={portalData.progress} />
            </div>

            <div className="mt-6">
              <EstimatedCompletionCard
                estimate={portalData.estimate}
              />
            </div>

            <section className="mt-9 border-t border-slate-200 pt-7 print:break-inside-avoid">
              <div className="grid gap-5 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Current Stage
                  </p>

                  <p className="mt-2 font-semibold text-slate-800">
                    {portalData.progress.stage}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Return Type
                  </p>

                  <p className="mt-2 font-semibold text-slate-800">
                    {portalData.summary.form}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status Date
                  </p>

                  <p className="mt-2 font-semibold text-slate-800">
                    {portalData.summary.updatedDate}
                  </p>
                </div>
              </div>
            </section>

            <PortalFooter />
          </div>
        </article>
      </div>
    </main>
  );
}
