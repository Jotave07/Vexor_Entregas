import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DriverDeliveryCard } from "@/components/driver-delivery-card";

export default async function DriverPortalPage() {
  const session = await requireAuth();

  if (session.role !== UserRole.DRIVER || !session.driverProfileId) {
    redirect("/dashboard");
  }

  const loads = await prisma.load.findMany({
    where: {
      driverId: session.driverProfileId,
      status: {
        in: ["OPEN", "IN_TRANSIT"]
      }
    },
    include: {
      orders: {
        include: {
          order: true
        }
      }
    },
    orderBy: { scheduledDate: "asc" }
  });

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="panel-dark p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-100/70">area do motorista</p>
          <h1 className="mt-3 text-3xl font-semibold">Suas cargas abertas</h1>
          <p className="mt-3 max-w-2xl text-sm text-brand-100/80">
            Visualize apenas os pedidos vinculados ao seu cadastro e atualize status, ocorrencias e comprovantes pelo celular.
          </p>
        </section>

        {loads.map((load) => (
          <section key={load.id} className="space-y-4">
            <div className="panel p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{load.code}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{load.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{load.routeDescription ?? "Sem rota detalhada"}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {load.orders.map(({ order }) => (
                <DriverDeliveryCard
                  key={order.id}
                  orderId={order.id}
                  orderNumber={order.erpOrderNumber}
                  customerName={order.customerName}
                  address={order.address}
                  currentStatus={order.currentStatus}
                  plannedDeliveryAt={order.plannedDeliveryAt}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
