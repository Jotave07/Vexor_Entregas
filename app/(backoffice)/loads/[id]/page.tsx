import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStatusLabels, orderStatusLabels } from "@/lib/status";
import { currency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function LoadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const load = await prisma.load.findUnique({
    where: { id },
    include: {
      driver: true,
      orders: {
        orderBy: { sequence: "asc" },
        include: {
          order: {
            include: {
              histories: {
                orderBy: { createdAt: "desc" },
                take: 3
              },
              occurrences: {
                orderBy: { createdAt: "desc" },
                take: 3
              },
              proofs: {
                orderBy: { createdAt: "desc" },
                take: 3
              }
            }
          }
        }
      }
    }
  });

  if (!load) {
    notFound();
  }

  const deliveredCount = load.orders.filter(({ order }) => order.currentStatus === "ENTREGUE").length;

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{load.code}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{load.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{load.routeDescription ?? "Sem descrição de rota"}</p>
            <p className="mt-3 text-xs text-slate-400">
              Origem da carga: {load.integrationRef ? `Winthor/n8n (${load.integrationRef})` : "Contingência operacional"}
            </p>
          </div>
          <StatusBadge
            label={loadStatusLabels[load.status]}
            tone={load.status === "IN_TRANSIT" ? "amber" : load.status === "OPEN" ? "blue" : "slate"}
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Motorista</p>
            <p className="mt-2 font-semibold text-slate-950">{load.driverNameSnapshot ?? load.driver?.fullName ?? "Não vinculado"}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Programação</p>
            <p className="mt-2 font-semibold text-slate-950">{formatDate(load.scheduledDate)}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Pedidos</p>
            <p className="mt-2 font-semibold text-slate-950">{load.orders.length}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Entregues</p>
            <p className="mt-2 font-semibold text-slate-950">{deliveredCount}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Placa do dia</p>
            <p className="mt-2 font-semibold text-slate-950">{load.vehiclePlate ?? "-"}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Filial de origem</p>
            <p className="mt-2 font-semibold text-slate-950">{load.originBranch ?? "-"}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Conferente</p>
            <p className="mt-2 font-semibold text-slate-950">{load.dispatcherName ?? "-"}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Saída real</p>
            <p className="mt-2 font-semibold text-slate-950">{formatDate(load.departedAt)}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {load.orders.map(({ id: assignmentId, sequence, order }) => {
          const tone =
            order.currentStatus === "ENTREGUE"
              ? "green"
              : order.currentStatus === "RECUSADO" || order.currentStatus === "DEVOLUCAO" || order.currentStatus === "OCORRENCIA"
                ? "rose"
                : order.currentStatus === "SAIU_PARA_ENTREGA"
                  ? "amber"
                  : "blue";

          return (
            <article key={assignmentId} className="panel p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Parada {sequence}</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">
                    {order.erpOrderNumber} · {order.customerName}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">{order.address ?? "Endereço não informado"}</p>
                </div>
                <StatusBadge label={orderStatusLabels[order.currentStatus]} tone={tone} />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">NF</p>
                  <p className="mt-2 font-semibold text-slate-950">{order.invoiceNumber ?? "-"}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Previsão</p>
                  <p className="mt-2 font-semibold text-slate-950">{formatDate(order.plannedDeliveryAt)}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Valor</p>
                  <p className="mt-2 font-semibold text-slate-950">{currency(order.totalValue?.toString())}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Comprovantes</p>
                  <p className="mt-2 font-semibold text-slate-950">{order.proofs.length}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Contato do cliente</p>
                  <p className="mt-2 font-semibold text-slate-950">{order.customerWhatsapp ?? order.customerPhone ?? "-"}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Recebedor previsto</p>
                  <p className="mt-2 font-semibold text-slate-950">{order.recipientName ?? "-"}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-950">Últimos status</p>
                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    {order.histories.length > 0 ? (
                      order.histories.map((history) => (
                        <div key={history.id} className="rounded-2xl bg-slate-50 p-3">
                          <p className="font-medium text-slate-900">{orderStatusLabels[history.toStatus]}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDate(history.createdAt)}</p>
                          <p className="mt-2">{history.notes ?? "Sem observações."}</p>
                        </div>
                      ))
                    ) : (
                      <p>Nenhum histórico operacional registrado.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-950">Ocorrências</p>
                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    {order.occurrences.length > 0 ? (
                      order.occurrences.map((occurrence) => (
                        <div key={occurrence.id} className="rounded-2xl bg-slate-50 p-3">
                          <p className="font-medium text-slate-900">{occurrence.description}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDate(occurrence.createdAt)}</p>
                        </div>
                      ))
                    ) : (
                      <p>Nenhuma ocorrência registrada.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-950">Comprovantes</p>
                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    {order.proofs.length > 0 ? (
                      order.proofs.map((proof) => (
                        <div key={proof.id} className="rounded-2xl bg-slate-50 p-3">
                          <p className="font-medium text-slate-900">{proof.fileName}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDate(proof.createdAt)}</p>
                          <a href={proof.fileUrl} target="_blank" className="mt-2 inline-block text-brand-700" rel="noreferrer">
                            Abrir comprovante
                          </a>
                        </div>
                      ))
                    ) : (
                      <p>Nenhum comprovante enviado.</p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
