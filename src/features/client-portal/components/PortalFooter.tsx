export function PortalFooter() {
  return (
    <footer className="mt-10 rounded-2xl bg-slate-50 px-6 py-5 text-center print:break-inside-avoid">
      <p className="text-sm font-semibold text-slate-700">
        Reality Check Business Solutions
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        This status report reflects the current position of the tax return
        within the RCBS workflow. Progress percentages and estimated completion
        windows are provided for general planning only and do not guarantee a
        specific completion, filing, government acceptance, refund, payment, or
        processing date.
      </p>

      <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
        Powered by Salinas OS
      </p>
    </footer>
  );
}