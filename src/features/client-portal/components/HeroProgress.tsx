import type { ClientPortalProgress } from "../types";

type HeroProgressProps = {
  progress: ClientPortalProgress;
};

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function HeroProgress({ progress }: HeroProgressProps) {
  const progressPercent = clampProgress(progress.progressPercent);

  return (
    <section className="mt-9 overflow-hidden rounded-3xl bg-slate-950 text-white print:break-inside-avoid">
      <div className="p-7 md:p-9">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
                Current Progress
              </p>

              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                {progress.stage}
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-bold leading-tight md:text-3xl">
              {progress.headline}
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
              {progress.description}
            </p>
          </div>

          <div className="shrink-0 text-left md:text-right">
            <div className="flex items-end gap-2 md:justify-end">
              <p className="text-6xl font-bold tracking-tight">
                {progressPercent}
              </p>

              <p className="pb-2 text-2xl font-bold text-blue-300">%</p>
            </div>

            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Workflow Complete
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Started</span>
            <span className="text-blue-300">Current position</span>
            <span className="text-slate-400">Filed</span>
          </div>

          <div
            className="h-4 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-label="Tax return workflow progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid border-t border-slate-800 bg-slate-900/70 sm:grid-cols-2">
        <div className="border-b border-slate-800 px-7 py-5 sm:border-b-0 sm:border-r md:px-9">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Current Stage
          </p>

          <p className="mt-2 text-sm font-semibold text-white">
            {progress.stage}
          </p>
        </div>

        <div className="px-7 py-5 md:px-9">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Process Status
          </p>

          <p className="mt-2 text-sm font-semibold text-white">
            Actively progressing through the RCBS workflow
          </p>
        </div>
      </div>
    </section>
  );
}