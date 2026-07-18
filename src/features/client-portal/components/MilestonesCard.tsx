import { ProgressTimeline } from "./ProgressTimeline";

type MilestonesCardProps = {
  currentProgress: number;
  currentStage: string;
  completedMilestones: number;
  totalMilestones: number;
};

export function MilestonesCard({
  currentProgress,
  currentStage,
  completedMilestones,
  totalMilestones,
}: MilestonesCardProps) {
  return (
    <section className="mt-9 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8 print:break-inside-avoid">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Tax Preparation Milestones
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {completedMilestones} of {totalMilestones} major workflow milestones
            completed
          </p>
        </div>

        <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Current stage
          </p>

          <p className="mt-1 text-sm font-bold text-blue-900">
            {currentStage}
          </p>
        </div>
      </div>

      <ProgressTimeline currentProgress={currentProgress} />
    </section>
  );
}