import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { orderStatusLabels } from "@/lib/status";
import { currency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: [{ updatedAt: "desc" }, { erpOrderNumber: "asc" }],
    include: {
      loads: {
        include: {
          load: {
            include: {
              driver: true
            }
          }
        }
      }
    }
  });

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-200 p-6">
        <p className="text-sm font-medium text-slate-500">Pedidos sincronizados</p>
        <h2 className="text-2xl font-semibold text-slate-950">Pedidos faturados em acompanhamento</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Visao operacional para acompanhamento de clientes, cargas, ocorrencias e comprovantes em campo.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-sm text-slate-500">
            <tr>
              <th className="px-6 py-4">Pedido ERP</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Contato</th>
              <th className="px-6 py-4">NF</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Carga</th>
              <th className="px-6 py-4">Motorista</th>
              <th className="px-6 py-4">Valor</th>
              <th className="px-6 py-4">Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const assignment = order.loads[0];
              const tone =
                order.currentStatus === "ENTREGUE"
                  ? "green"
                  : order.currentStatus === "RECUSADO" || order.currentStatus === "DEVOLUCAO" || order.currentStatus === "OCORRENCIA"
                    ? "rose"
                    : order.currentStatus === "SAIU_PARA_ENTREGA"
                      ? "amber"
                      : "blue";

              return (
                <tr key={order.id} className="border-t border-slate-100 text-sm">
                  <td className="px-6 py-4 font-semibold text-slate-950">{order.erpOrderNumber}</td>
                  <td className="px-6 py-4">{order.customerName}</td>
                  <td className="px-6 py-4">{order.customerWhatsapp ?? order.customerPhone ?? "-"}</td>
                  <td className="px-6 py-4">{order.invoiceNumber ?? "-"}</td>
                  <td className="px-6 py-4">
                    <StatusBadge label={orderStatusLabels[order.currentStatus]} tone={tone} />
                  </td>
                  <td className="px-6 py-4">
                    {assignment?.load ? (
                      <Link href={`/loads/${assignment.load.id}`} className="font-medium text-brand-700">
                        {assignment.load.code}
                      </Link>
                    ) : (
                      "Sem carga"
                    )}
                  </td>
                  <td className="px-6 py-4">{assignment?.load.driver?.fullName ?? "Sem motorista"}</td>
                  <td className="px-6 py-4">{currency(order.totalValue?.toString())}</td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(order.updatedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
