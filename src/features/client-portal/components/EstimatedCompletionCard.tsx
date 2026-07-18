import type { ClientPortalEstimate } from "../types";

type EstimatedCompletionCardProps = {
  estimate: ClientPortalEstimate;
};

export function EstimatedCompletionCard({
  estimate,
}: EstimatedCompletionCardProps) {
  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 print:break-inside-avoid">
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700"
          aria-hidden="true"
        >
          ◷
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Estimated Completion Window
          </p>

          <h3 className="mt-2 text-lg font-bold text-blue-950">
            {estimate.label}
          </h3>

          <p className="mt-3 text-sm leading-7 text-blue-900">
            This estimate is intended to help with general planning based on
            the return&apos;s current position in the RCBS workflow.
          </p>

          <div className="mt-5 rounded-xl border border-blue-200 bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Important
            </p>

            <p className="mt-1 text-xs leading-6 text-blue-900">
              {estimate.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}