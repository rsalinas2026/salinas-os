import Image from "next/image";

type PortalHeaderProps = {
  updatedDate: string;
};

export function PortalHeader({
  updatedDate,
}: PortalHeaderProps) {
  return (
    <header className="border-b border-slate-200 px-7 py-6 md:px-10 print:px-0 print:pb-5 print:pt-0">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <div className="w-56">
            <Image
              src="/images/rcbs-logo.png"
              alt="Reality Check Business Solutions"
              width={1000}
              height={151}
              priority
              className="h-auto w-full object-contain"
            />
          </div>

          <div className="hidden border-l border-slate-200 pl-5 sm:block">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">
              Salinas OS
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Client Tax Status
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Status updated
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {updatedDate}
          </p>
        </div>
      </div>
    </header>
  );
}