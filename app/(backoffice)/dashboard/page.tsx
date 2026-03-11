import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import { LoadCard } from "@/components/load-card";
import { currency } from "@/lib/utils";

export default async function DashboardPage() {
  const [ordersCount, openLoadsCount, activeDriversCount, deliveredCount, recentLoads, pendingOrdersValue] =
    await Promise.all([
      prisma.order.count(),
      prisma.load.count({ where: { status: "OPEN" } }),
      prisma.driverProfile.count({ where: { status: "ACTIVE" } }),
      prisma.order.count({ where: { currentStatus: "DELIVERED" } }),
      prisma.load.findMany({
        take: 3,
        orderBy: { updatedAt: "desc" },
        include: { driver: true }
      }),
      prisma.order.aggregate({
        _sum: { totalValue: true },
        where: { currentStatus: { in: ["IMPORTED", "AVAILABLE", "ASSIGNED", "ON_ROUTE"] } }
      })
    ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-5">
        <StatCard label="Pedidos faturados" value={String(ordersCount)} hint="Base consolidada do ERP e web." />
        <StatCard label="Cargas abertas" value={String(openLoadsCount)} hint="Prontas para expedicao ou em rota." />
        <StatCard label="Motoristas ativos" value={String(activeDriversCount)} hint="Proprios e agregados habilitados." />
        <StatCard label="Entregues" value={String(deliveredCount)} hint="Indicador inicial de performance." />
        <StatCard
          label="Valor em operacao"
          value={currency(pendingOrdersValue._sum.totalValue?.toString())}
          hint="Pedidos ainda em fluxo logistico."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel p-6">
          <p className="text-sm font-medium text-slate-500">Painel operacional</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">Fluxo sugerido</h3>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              "Winthor envia pedidos faturados",
              "Operacao monta carga e vincula motorista",
              "Motorista visualiza cargas abertas",
              "Status, ocorrencias e comprovantes retornam para o portal"
            ].map((step, index) => (
              <div key={step} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">Etapa {index + 1}</p>
                <p className="mt-3 text-sm font-medium text-slate-800">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <p className="text-sm font-medium text-slate-500">API e integracoes</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">Endpoints iniciais</h3>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p><span className="font-semibold text-slate-900">POST</span> /api/integrations/winthor/orders</p>
            <p><span className="font-semibold text-slate-900">GET</span> /api/orders</p>
            <p><span className="font-semibold text-slate-900">POST</span> /api/loads</p>
            <p><span className="font-semibold text-slate-900">POST</span> /api/driver/orders/:id/status</p>
            <p><span className="font-semibold text-slate-900">POST</span> /api/integrations/n8n/webhooks/status</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-500">Cargas recentes</p>
          <h3 className="text-xl font-semibold text-slate-950">Visao rapida da expedicao</h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {recentLoads.map((load) => (
            <LoadCard
              key={load.id}
              code={load.code}
              title={load.title}
              driverName={load.driver?.fullName}
              scheduledDate={load.scheduledDate}
              status={load.status}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
