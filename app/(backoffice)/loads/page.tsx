import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AdminLoadForm } from "@/components/forms/admin-load-form";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStatusLabels, orderStatusLabels } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function LoadsPage() {
  const session = await requireAuth();
  const [loads, drivers, availableOrders] = await Promise.all([
    prisma.load.findMany({
      include: {
        driver: true,
        orders: {
          include: { order: true }
        }
      },
      orderBy: [{ scheduledDate: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.driverProfile.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" }
    }),
    prisma.order.findMany({
      where: {
        loads: {
          none: {}
        }
      },
      select: {
        id: true,
        erpOrderNumber: true,
        customerName: true
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <div className="space-y-4">
      <section className="panel p-5">
        <p className="text-sm font-medium text-slate-500">Gestao de cargas</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Cargas operacionais</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Visualize as cargas do dia, acompanhe o andamento e expanda cada carga para ver os pedidos vinculados.
        </p>
      </section>

      {session.role === UserRole.ADMIN ? (
        <AdminLoadForm drivers={drivers} availableOrders={availableOrders} />
      ) : (
        <section className="panel p-5 text-sm text-slate-600">
          Apenas administradores podem tratar contingencias. Seu perfil pode monitorar abaixo as cargas recebidas e seus pedidos.
        </section>
      )}

      <section className="space-y-3">
        {loads.map((load, index) => {
          const tone =
            load.status === "FINISHED"
              ? "green"
              : load.status === "IN_TRANSIT"
                ? "amber"
                : load.status === "OPEN"
                  ? "blue"
                  : "slate";

          return (
            <details key={load.id} className="panel overflow-hidden" open={index === 0}>
              <summary className="cursor-pointer list-none p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{load.code}</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">{load.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{load.routeDescription ?? "Sem descricao de rota"}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="grid min-w-[320px] grid-cols-3 gap-2 text-sm">
                      <div className="panel-edge px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Motorista</p>
                        <p className="mt-1 font-semibold text-slate-900">{load.driver?.fullName ?? "Sem vinculo"}</p>
                      </div>
                      <div className="panel-edge px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Pedidos</p>
                        <p className="mt-1 font-semibold text-slate-900">{load.orders.length}</p>
                      </div>
                      <div className="panel-edge px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Data</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatDate(load.scheduledDate)}</p>
                      </div>
                    </div>
                    <StatusBadge label={loadStatusLabels[load.status]} tone={tone} />
                  </div>
                </div>
              </summary>

              <div className="border-t border-slate-200 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Pedidos da carga</p>
                  <Link href={`/loads/${load.id}`} className="text-sm font-semibold text-brand-700">
                    Ver detalhe completo
                  </Link>
                </div>

                <div className="grid gap-2">
                  {load.orders.map(({ order }, orderIndex) => (
                    <div key={order.id} className="panel-edge px-4 py-3">
                      <div className="grid gap-3 md:grid-cols-[90px_1.15fr_1fr_auto] md:items-center">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Parada</p>
                          <p className="mt-1 font-semibold text-slate-900">{orderIndex + 1}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">{order.erpOrderNumber}</p>
                          <p className="text-sm text-slate-500">{order.customerName}</p>
                        </div>
                        <div className="text-sm text-slate-500">{order.address ?? "Endereco nao informado"}</div>
                        <div className="justify-self-start md:justify-self-end">
                          <StatusBadge label={orderStatusLabels[order.currentStatus]} tone="slate" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
