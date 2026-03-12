import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import { LoadCard } from "@/components/load-card";
import { currency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [ordersCount, openLoadsCount, activeDriversCount, inTransitCount, recentLoads, pendingOrdersValue, syncedLoadsCount] =
    await Promise.all([
      prisma.order.count(),
      prisma.load.count({ where: { status: { in: ["OPEN", "IN_TRANSIT"] } } }),
      prisma.driverProfile.count({ where: { status: "ACTIVE" } }),
      prisma.order.count({ where: { currentStatus: "ON_ROUTE" } }),
      prisma.load.findMany({
        take: 4,
        orderBy: { updatedAt: "desc" },
        include: {
          driver: true,
          orders: true
        }
      }),
      prisma.order.aggregate({
        _sum: { totalValue: true },
        where: { currentStatus: { in: ["IMPORTED", "AVAILABLE", "ASSIGNED", "ON_ROUTE"] } }
      }),
      prisma.load.count({
        where: {
          integrationRef: {
            not: null
          }
        }
      })
    ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-5">
        <StatCard label="Pedidos importados" value={String(ordersCount)} hint="Base sincronizada do Winthor via n8n." />
        <StatCard label="Cargas em operação" value={String(openLoadsCount)} hint="Cargas abertas ou em trânsito na rua." />
        <StatCard label="Motoristas ativos" value={String(activeDriversCount)} hint="Motoristas aptos para execução e retorno." />
        <StatCard label="Pedidos em rota" value={String(inTransitCount)} hint="Entregas acompanhadas em tempo real pelo portal." />
        <StatCard
          label="Valor em trânsito"
          value={currency(pendingOrdersValue._sum.totalValue?.toString())}
          hint="Pedidos ainda em fluxo operacional."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel p-6">
          <p className="text-sm font-medium text-slate-500">Fluxo oficial</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">Winthor, n8n e operação em campo</h3>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              "Winthor envia cargas prontas, pedidos e motoristas para o n8n.",
              "n8n trata regras, clientes e sincroniza os dados no portal.",
              "Operação acompanha a carga, o motorista e exceções da rota.",
              "Motorista atualiza status, ocorrências e comprovantes em campo."
            ].map((step, index) => (
              <div key={step} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">Etapa {index + 1}</p>
                <p className="mt-3 text-sm font-medium text-slate-800">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <p className="text-sm font-medium text-slate-500">Integrações ativas</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">Resumo do ecossistema</h3>

          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">Cargas sincronizadas</p>
              <p className="mt-2 text-2xl font-semibold text-brand-700">{syncedLoadsCount}</p>
              <p className="mt-1">Total de cargas já recebidas do fluxo Winthor + n8n.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">Endpoints centrais</p>
              <div className="mt-3 space-y-2">
                <p><span className="font-semibold text-slate-900">POST</span> /api/integrations/winthor/drivers</p>
                <p><span className="font-semibold text-slate-900">POST</span> /api/integrations/winthor/orders</p>
                <p><span className="font-semibold text-slate-900">POST</span> /api/integrations/winthor/loads</p>
                <p><span className="font-semibold text-slate-900">GET</span> /api/integrations/n8n/events</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Cargas recentes</p>
            <h3 className="text-xl font-semibold text-slate-950">Painel de monitoramento operacional</h3>
          </div>
          <Link href="/loads" className="text-sm font-semibold text-brand-700">
            Ver todas as cargas
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {recentLoads.map((load) => (
            <LoadCard
              key={load.id}
              code={load.code}
              title={load.title}
              driverName={load.driver?.fullName}
              scheduledDate={load.scheduledDate}
              status={load.status}
              orderCount={load.orders.length}
              integrationRef={load.integrationRef}
              href={`/loads/${load.id}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
