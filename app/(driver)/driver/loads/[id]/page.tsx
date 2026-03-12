import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStatusLabels, orderStatusLabels } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { DriverDeliveryCard } from "@/components/driver-delivery-card";

export const dynamic = "force-dynamic";

export default async function DriverLoadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();

  if (session.role !== UserRole.DRIVER || !session.driverProfileId) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const load = await prisma.load.findFirst({
    where: {
      id,
      driverId: session.driverProfileId
    },
    include: {
      orders: {
        orderBy: { sequence: "asc" },
        include: {
          order: true
        }
      }
    }
  });

  if (!load) {
    notFound();
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{load.code}</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">{load.title}</h1>
              <p className="mt-2 text-sm text-slate-500">{load.routeDescription ?? "Sem descrição de rota"}</p>
              <p className="mt-3 text-sm text-slate-500">Programação: {formatDate(load.scheduledDate)}</p>
            </div>
            <StatusBadge
              label={loadStatusLabels[load.status]}
              tone={load.status === "IN_TRANSIT" ? "amber" : load.status === "OPEN" ? "blue" : "slate"}
            />
          </div>

          <div className="mt-5">
            <Link href="/driver" className="text-sm font-semibold text-brand-700">
              Voltar para minhas cargas
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          {load.orders.map(({ order }, index) => (
            <details key={order.id} className="panel overflow-hidden" open={index === 0}>
              <summary className="cursor-pointer list-none p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Parada {index + 1}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{order.customerName}</p>
                    <p className="mt-1 text-sm text-slate-500">{order.erpOrderNumber}</p>
                  </div>
                  <StatusBadge label={orderStatusLabels[order.currentStatus]} tone="slate" />
                </div>
              </summary>

              <div className="border-t border-slate-200 p-5">
                <DriverDeliveryCard
                  orderId={order.id}
                  orderNumber={order.erpOrderNumber}
                  customerName={order.customerName}
                  address={order.address}
                  currentStatus={order.currentStatus}
                  plannedDeliveryAt={order.plannedDeliveryAt}
                />
              </div>
            </details>
          ))}
        </section>
      </div>
    </main>
  );
}
