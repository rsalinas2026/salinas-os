import {
  CLIENT_PORTAL_STAGES,
  getCurrentTimelineStage,
  isTimelineStageCompleted,
} from "../utils/client-stages";

type ProgressTimelineProps = {
  currentProgress: number;
};

export function ProgressTimeline({
  currentProgress,
}: ProgressTimelineProps) {
  const currentStage = getCurrentTimelineStage(currentProgress);

  return (
    <div className="mt-8">
      <div className="hidden grid-cols-8 gap-2 lg:grid">
        {CLIENT_PORTAL_STAGES.map((stage, index) => {
          const isCompleted = isTimelineStageCompleted(
            stage.progress,
            currentProgress,
          );

          const isCurrent = currentStage?.name === stage.name;

          return (
            <div key={stage.name} className="relative text-center">
              {index < CLIENT_PORTAL_STAGES.length - 1 ? (
                <div
                  className={[
                    "absolute left-[calc(50%+1rem)] top-4 h-0.5 w-[calc(100%-2rem)]",
                    isCompleted ? "bg-blue-600" : "bg-slate-200",
                  ].join(" ")}
                />
              ) : null}

              <div
                className={[
                  "relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                  isCompleted
                    ? "border-blue-600 bg-blue-600 text-white"
                    : isCurrent
                      ? "border-blue-600 bg-white text-blue-700 shadow-sm"
                      : "border-slate-300 bg-white text-slate-400",
                ].join(" ")}
              >
                {isCompleted ? "✓" : isCurrent ? "•" : ""}
              </div>

              <p
                className={[
                  "mt-3 text-xs font-semibold leading-4",
                  isCompleted || isCurrent
                    ? "text-slate-800"
                    : "text-slate-400",
                ].join(" ")}
              >
                {stage.name}
              </p>
            </div>
          );
        })}
      </div>

      <div className="space-y-0 lg:hidden">
        {CLIENT_PORTAL_STAGES.map((stage, index) => {
          const isCompleted = isTimelineStageCompleted(
            stage.progress,
            currentProgress,
          );

          const isCurrent = currentStage?.name === stage.name;

          return (
            <div key={stage.name} className="relative flex gap-3 pb-5">
              {index < CLIENT_PORTAL_STAGES.length - 1 ? (
                <div
                  className={[
                    "absolute left-[13px] top-7 h-[calc(100%-0.25rem)] w-0.5",
                    isCompleted ? "bg-blue-600" : "bg-slate-200",
                  ].join(" ")}
                />
              ) : null}

              <div
                className={[
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                  isCompleted
                    ? "border-blue-600 bg-blue-600 text-white"
                    : isCurrent
                      ? "border-blue-600 bg-white text-blue-700"
                      : "border-slate-300 bg-white text-slate-400",
                ].join(" ")}
              >
                {isCompleted ? "✓" : isCurrent ? "•" : ""}
              </div>

              <div className="-mt-0.5">
                <p
                  className={[
                    "text-sm font-semibold",
                    isCompleted || isCurrent
                      ? "text-slate-800"
                      : "text-slate-400",
                  ].join(" ")}
                >
                  {stage.name}
                </p>

                {isCurrent ? (
                  <p className="mt-1 text-xs font-medium text-blue-700">
                    Current stage
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}