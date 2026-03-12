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
      prisma.order.count({ where: { currentStatus: "SAIU_PARA_ENTREGA" } }),
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
        where: {
          currentStatus: {
            in: ["FATURADO", "AGUARDANDO_CARREGAMENTO", "CARREGADO", "SAIU_PARA_ENTREGA", "OCORRENCIA"]
          }
        }
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
    <div className="space-y-5">
      <section className="grid gap-3 xl:grid-cols-5">
        <StatCard label="Pedidos faturados" value={String(ordersCount)} hint="Base operacional carregada no portal." />
        <StatCard label="Cargas em operacao" value={String(openLoadsCount)} hint="Cargas abertas ou em transito na rua." />
        <StatCard label="Motoristas ativos" value={String(activeDriversCount)} hint="Motoristas aptos para execucao." />
        <StatCard label="Sairam para entrega" value={String(inTransitCount)} hint="Pedidos em execucao na rua." />
        <StatCard label="Valor em transito" value={currency(pendingOrdersValue._sum.totalValue?.toString())} hint="Pedidos em fluxo operacional." />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel p-5">
          <p className="text-sm font-medium text-slate-500">Visao operacional</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">Painel de execucao do dia</h3>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Cargas prontas recebidas para acompanhamento.",
              "Pedidos monitorados por carga e motorista.",
              "Ocorrencias e comprovantes centralizados.",
              "Equipe acompanha andamento e retorno do dia."
            ].map((step, index) => (
              <div key={step} className="panel-edge p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">Bloco {index + 1}</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <p className="text-sm font-medium text-slate-500">Resumo rapido</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">Indicadores de cargas</h3>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="panel-edge p-4">
              <p className="font-semibold text-slate-950">Cargas recebidas</p>
              <p className="mt-2 text-2xl font-semibold text-brand-700">{syncedLoadsCount}</p>
              <p className="mt-1">Total de cargas carregadas no portal.</p>
            </div>
            <div className="panel-edge p-4">
              <p className="font-semibold text-slate-950">Foco do dia</p>
              <div className="mt-3 space-y-2">
                <p>Cargas abertas aguardando conclusao.</p>
                <p>Pedidos com comprovante registrado.</p>
                <p>Ocorrencias pendentes de tratativa.</p>
                <p>Entregas concluidas no turno.</p>
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

        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
          {recentLoads.map((load) => (
            <LoadCard
              key={load.id}
              code={load.code}
              title={load.title}
              driverName={load.driver?.fullName}
              scheduledDate={load.scheduledDate}
              status={load.status}
              orderCount={load.orders.length}
              href={`/loads/${load.id}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
