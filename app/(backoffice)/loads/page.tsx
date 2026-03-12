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
      <section className="panel p-6">
        <p className="text-sm font-medium text-slate-500">Gestão de cargas</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Cargas prontas recebidas do Winthor via n8n</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          O fluxo principal do portal é acompanhar e operar cargas já montadas no ERP. A criação manual abaixo existe apenas
          como contingência administrativa para exceções operacionais.
        </p>
      </section>

      {session.role === UserRole.ADMIN ? (
        <AdminLoadForm drivers={drivers} availableOrders={availableOrders} />
      ) : (
        <section className="panel p-6 text-sm text-slate-600">
          Apenas administradores podem abrir cargas manuais de contingência. Seu perfil pode monitorar abaixo as cargas
          sincronizadas e seus pedidos.
        </section>
      )}

      {loads.map((load) => {
        const tone =
          load.status === "FINISHED"
            ? "green"
            : load.status === "IN_TRANSIT"
              ? "amber"
              : load.status === "OPEN"
                ? "blue"
                : "slate";

        return (
          <section key={load.id} className="panel p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{load.code}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{load.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{load.routeDescription ?? "Sem descrição de rota"}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Origem: {load.integrationRef ? `Winthor/n8n (${load.integrationRef})` : "Contingência interna"}
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <StatusBadge label={loadStatusLabels[load.status]} tone={tone} />
                <Link href={`/loads/${load.id}`} className="text-sm font-semibold text-brand-700">
                  Abrir detalhe da carga
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Motorista</p>
                <p className="mt-2 font-semibold text-slate-950">{load.driver?.fullName ?? "Não vinculado"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Data programada</p>
                <p className="mt-2 font-semibold text-slate-950">{formatDate(load.scheduledDate)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Pedidos na carga</p>
                <p className="mt-2 font-semibold text-slate-950">{load.orders.length}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Entregues</p>
                <p className="mt-2 font-semibold text-slate-950">
                  {load.orders.filter(({ order }) => order.currentStatus === "DELIVERED").length}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-slate-500">Pedidos vinculados</p>
              <div className="grid gap-3 md:grid-cols-2">
                {load.orders.map(({ order }) => (
                  <div key={order.id} className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{order.erpOrderNumber}</p>
                        <p className="mt-1 text-sm text-slate-500">{order.customerName}</p>
                      </div>
                      <StatusBadge label={orderStatusLabels[order.currentStatus]} tone="slate" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
