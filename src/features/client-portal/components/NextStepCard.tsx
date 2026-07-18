type NextStepCardProps = {
  nextStep: string;
};

export function NextStepCard({ nextStep }: NextStepCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 print:break-inside-avoid">
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-700"
          aria-hidden="true"
        >
          →
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            What Happens Next
          </p>

          <h3 className="mt-2 text-lg font-bold text-slate-950">
            The next step in your tax workflow
          </h3>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            {nextStep}
          </p>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Our process
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-700">
              Each return advances through preparation, review, approval, and
              filing controls designed to protect accuracy and completeness.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}