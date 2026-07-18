import type { ClientPortalProgress } from "../types";

type ClientActionPanelProps = {
  progress: ClientPortalProgress;
};

export function ClientActionPanel({
  progress,
}: ClientActionPanelProps) {
  const actionRequired = progress.clientActionRequired;

  return (
    <section
      className={[
        "rounded-2xl border p-6 print:break-inside-avoid",
        actionRequired
          ? "border-amber-300 bg-amber-50"
          : "border-emerald-200 bg-emerald-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold",
            actionRequired
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700",
          ].join(" ")}
          aria-hidden="true"
        >
          {actionRequired ? "!" : "✓"}
        </div>

        <div className="min-w-0">
          <p
            className={[
              "text-xs font-bold uppercase tracking-[0.18em]",
              actionRequired
                ? "text-amber-700"
                : "text-emerald-700",
            ].join(" ")}
          >
            {actionRequired
              ? "Client Action Required"
              : "No Client Action Required"}
          </p>

          <h3
            className={[
              "mt-2 text-lg font-bold",
              actionRequired
                ? "text-amber-950"
                : "text-emerald-950",
            ].join(" ")}
          >
            {actionRequired
              ? "Your response is needed to keep the process moving"
              : "Your file is currently with our team"}
          </h3>

          <p
            className={[
              "mt-3 text-sm leading-7",
              actionRequired
                ? "text-amber-900"
                : "text-emerald-900",
            ].join(" ")}
          >
            {actionRequired
              ? progress.clientActionMessage
              : "No action is required from you at this time. Our team will continue advancing your file through the tax preparation and quality-control process."}
          </p>

          {actionRequired ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-white/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Recommended next step
              </p>

              <p className="mt-1 text-sm font-medium leading-6 text-amber-950">
                Please review the request from our team and provide the missing
                information as soon as possible.
              </p>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <span
                className="h-2 w-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              />

              We will contact you if anything else is needed.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}