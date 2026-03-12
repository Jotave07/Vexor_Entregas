import Link from "next/link";
import { loadStatusLabels } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

type LoadCardProps = {
  code: string;
  title: string;
  driverName?: string | null;
  scheduledDate?: Date | null;
  status: keyof typeof loadStatusLabels;
  orderCount?: number;
  integrationRef?: string | null;
  href?: string;
};

export function LoadCard({ code, title, driverName, scheduledDate, status, orderCount, integrationRef, href }: LoadCardProps) {
  const tone =
    status === "OPEN" ? "blue" : status === "IN_TRANSIT" ? "amber" : status === "FINISHED" ? "green" : "slate";

  const content = (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{code}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3>
          {integrationRef ? <p className="mt-2 text-xs text-slate-400">Integração: {integrationRef}</p> : null}
        </div>
        <StatusBadge label={loadStatusLabels[status]} tone={tone} />
      </div>

      <dl className="mt-5 grid gap-3 text-sm text-slate-600">
        <div className="flex justify-between gap-2">
          <dt>Motorista</dt>
          <dd className="font-medium text-slate-900">{driverName ?? "Não vinculado"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Programação</dt>
          <dd className="font-medium text-slate-900">{formatDate(scheduledDate)}</dd>
        </div>
        {orderCount !== undefined ? (
          <div className="flex justify-between gap-2">
            <dt>Pedidos</dt>
            <dd className="font-medium text-slate-900">{orderCount}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block transition hover:-translate-y-0.5">
      {content}
    </Link>
  );
}
