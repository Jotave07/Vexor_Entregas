import Link from "next/link";
import { orderStatusLabels } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

type DriverDeliveryCardProps = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  address?: string | null;
  currentStatus: keyof typeof orderStatusLabels;
  plannedDeliveryAt?: Date | null;
};

export function DriverDeliveryCard({
  orderId,
  orderNumber,
  customerName,
  address,
  currentStatus,
  plannedDeliveryAt
}: DriverDeliveryCardProps) {
  const tone =
    currentStatus === "ENTREGUE"
      ? "green"
      : currentStatus === "SAIU_PARA_ENTREGA"
        ? "amber"
        : currentStatus === "RECUSADO" || currentStatus === "DEVOLUCAO" || currentStatus === "OCORRENCIA"
          ? "rose"
          : "blue";

  return (
    <div className="panel-edge p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{orderNumber}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">{customerName}</h3>
        </div>
        <StatusBadge label={orderStatusLabels[currentStatus]} tone={tone} />
      </div>

      <p className="mt-3 text-sm text-slate-600">{address ?? "Endereco nao informado"}</p>
      <p className="mt-1 text-sm text-slate-500">Previsao: {formatDate(plannedDeliveryAt)}</p>

      <div className="mt-3 flex gap-3">
        <Link
          href={`/driver/orders/${orderId}`}
          className="inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white"
        >
          Atualizar entrega
        </Link>
      </div>
    </div>
  );
}
