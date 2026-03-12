import Link from "next/link";
import { loadStatusLabels } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

type DriverLoadCardProps = {
  id: string;
  code: string;
  title: string;
  routeDescription?: string | null;
  scheduledDate?: Date | null;
  status: keyof typeof loadStatusLabels;
  orderCount: number;
  deliveredCount: number;
};

export function DriverLoadCard({
  id,
  code,
  title,
  routeDescription,
  scheduledDate,
  status,
  orderCount,
  deliveredCount
}: DriverLoadCardProps) {
  const tone = status === "IN_TRANSIT" ? "amber" : status === "OPEN" ? "blue" : "slate";

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{code}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3>
        </div>
        <StatusBadge label={loadStatusLabels[status]} tone={tone} />
      </div>

      <p className="mt-4 text-sm text-slate-600">{routeDescription ?? "Sem rota detalhada informada"}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-slate-500">Programação</p>
          <p className="mt-1 font-semibold text-slate-950">{formatDate(scheduledDate)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-slate-500">Progresso</p>
          <p className="mt-1 font-semibold text-slate-950">
            {deliveredCount}/{orderCount} entregues
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Link
          href={`/driver/loads/${id}`}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand-600 px-4 text-sm font-semibold text-white"
        >
          Abrir carga
        </Link>
      </div>
    </div>
  );
}
