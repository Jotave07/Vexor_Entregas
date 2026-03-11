import { orderStatusLabels } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { AppLink } from "@/components/providers/navigation-progress";
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
    currentStatus === "DELIVERED"
      ? "green"
      : currentStatus === "ON_ROUTE"
        ? "amber"
        : currentStatus === "FAILED"
          ? "rose"
          : "blue";

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{orderNumber}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{customerName}</h3>
        </div>
        <StatusBadge label={orderStatusLabels[currentStatus]} tone={tone} />
      </div>

      <p className="mt-4 text-sm text-slate-600">{address ?? "Endereco nao informado"}</p>
      <p className="mt-2 text-sm text-slate-500">Previsao: {formatDate(plannedDeliveryAt)}</p>

      <div className="mt-4 flex gap-3">
        <AppLink
          href={`/driver/orders/${orderId}`}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand-600 px-4 text-sm font-semibold text-white"
        >
          Atualizar status
        </AppLink>
      </div>
    </div>
  );
}
