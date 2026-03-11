import { prisma } from "@/lib/prisma";
import { orderStatusLabels } from "@/lib/status";
import { currency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
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
        <p className="text-sm font-medium text-slate-500">Pedidos faturados</p>
        <h2 className="text-2xl font-semibold text-slate-950">Base inicial integrada ao ERP</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-sm text-slate-500">
            <tr>
              <th className="px-6 py-4">Pedido ERP</th>
              <th className="px-6 py-4">Cliente</th>
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
                order.currentStatus === "DELIVERED"
                  ? "green"
                  : order.currentStatus === "FAILED"
                    ? "rose"
                    : order.currentStatus === "ON_ROUTE"
                      ? "amber"
                      : "blue";

              return (
                <tr key={order.id} className="border-t border-slate-100 text-sm">
                  <td className="px-6 py-4 font-semibold text-slate-950">{order.erpOrderNumber}</td>
                  <td className="px-6 py-4">{order.customerName}</td>
                  <td className="px-6 py-4">{order.invoiceNumber ?? "-"}</td>
                  <td className="px-6 py-4">
                    <StatusBadge label={orderStatusLabels[order.currentStatus]} tone={tone} />
                  </td>
                  <td className="px-6 py-4">{assignment?.load.code ?? "Sem carga"}</td>
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
