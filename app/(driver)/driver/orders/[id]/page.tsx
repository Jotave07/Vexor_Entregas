import { notFound, redirect } from "next/navigation";
import { OrderStatus, UserRole } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { historySourceLabels, occurrenceTypeLabels, orderStatusLabels } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

const allowedStatuses: OrderStatus[] = ["ON_ROUTE", "DELIVERED", "FAILED", "RETURNED"];

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
      histories: {
        orderBy: { createdAt: "desc" },
        take: 6
      }
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{order.erpOrderNumber}</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">{order.customerName}</h1>
          <p className="mt-2 text-sm text-slate-500">{order.address ?? "Endereco nao informado"}</p>
          <p className="mt-2 text-sm text-slate-500">Previsao: {formatDate(order.plannedDeliveryAt)}</p>

          <form action={`/api/driver/orders/${order.id}/status`} method="post" className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Novo status</label>
              <Select name="status" defaultValue="ON_ROUTE">
                {allowedStatuses.map((status) => (
                  <option key={status} value={status}>
                    {orderStatusLabels[status]}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Observacao</label>
              <Textarea name="notes" placeholder="Ex.: cliente recebeu sem ressalvas." />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Ocorrencia opcional</label>
              <Select name="occurrenceType" defaultValue="">
                <option value="">Sem ocorrencia</option>
                {Object.entries(occurrenceTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Comprovante</label>
              <input
                className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm"
                type="file"
                name="proof"
              />
            </div>

            <Button type="submit" className="w-full">
              Atualizar entrega
            </Button>
          </form>
        </section>

        <section className="panel p-6">
          <p className="text-sm font-medium text-slate-500">Historico recente</p>
          <div className="mt-5 space-y-4">
            {order.histories.map((history) => (
              <div key={history.id} className="rounded-3xl bg-slate-50 p-4">
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
