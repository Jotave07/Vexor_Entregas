import { notFound, redirect } from "next/navigation";
import { OrderStatus, UserRole } from "@prisma/client";
import { DriverOrderStatusForm } from "@/components/forms/driver-order-status-form";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { historySourceLabels, orderStatusLabels } from "@/lib/status";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const allowedStatuses: OrderStatus[] = [
  "SAIU_PARA_ENTREGA",
  "ENTREGUE",
  "ENTREGA_PARCIAL",
  "CLIENTE_AUSENTE",
  "RECUSADO",
  "DEVOLUCAO",
  "OCORRENCIA"
];

export default async function DriverOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();

  if (session.role !== UserRole.DRIVER || !session.driverProfileId) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      loads: {
        some: {
          load: {
            driverId: session.driverProfileId
          }
        }
      }
    },
    include: {
      loads: {
        include: {
          load: true
        }
      },
      histories: {
        orderBy: { createdAt: "desc" },
        take: 6
      }
    }
  });

  if (!order) {
    notFound();
  }

  const redirectPath = order.loads[0]?.loadId ? `/driver/loads/${order.loads[0].loadId}` : "/driver";

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{order.erpOrderNumber}</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">{order.customerName}</h1>
          <p className="mt-2 text-sm text-slate-500">{order.address ?? "Endereco nao informado"}</p>
          <p className="mt-2 text-sm text-slate-500">Previsao: {formatDate(order.plannedDeliveryAt)}</p>
          <p className="mt-2 text-sm text-slate-500">Carga: {order.loads[0]?.load.code ?? "Nao identificada"}</p>
          <p className="mt-2 text-sm text-slate-500">Contato: {order.customerWhatsapp ?? order.customerPhone ?? "Nao informado"}</p>

          <DriverOrderStatusForm
            orderId={order.id}
            redirectPath={redirectPath}
            allowedStatuses={allowedStatuses}
          />
        </section>

        <section className="panel p-6">
          <p className="text-sm font-medium text-slate-500">Ultimas atualizacoes</p>
          <div className="mt-5 space-y-4">
            {order.histories.map((history) => (
              <div key={history.id} className="panel-edge p-4">
                <p className="text-sm font-semibold text-slate-950">{orderStatusLabels[history.toStatus]}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">{historySourceLabels[history.source]}</p>
                <p className="mt-2 text-sm text-slate-500">{history.notes ?? "Sem observacao"}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(history.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
