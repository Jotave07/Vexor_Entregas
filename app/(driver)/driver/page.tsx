import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DriverLoadCard } from "@/components/driver-load-card";

export const dynamic = "force-dynamic";

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
    orderBy: [{ scheduledDate: "asc" }, { updatedAt: "desc" }]
  });

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="panel-dark p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-100/70">área do motorista</p>
          <h1 className="mt-3 text-3xl font-semibold">Minhas cargas em execução</h1>
          <p className="mt-3 max-w-2xl text-sm text-brand-100/80">
            Aqui você acompanha apenas as cargas abertas no seu cadastro, com acesso rápido aos pedidos, ocorrências,
            comprovantes e confirmação de entrega na rua.
          </p>
        </section>

        {loads.length === 0 ? (
          <section className="panel p-6 text-sm text-slate-600">
            Nenhuma carga aberta foi vinculada ao seu cadastro no momento.
          </section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {loads.map((load) => (
              <DriverLoadCard
                key={load.id}
                id={load.id}
                code={load.code}
                title={load.title}
                routeDescription={load.routeDescription}
                scheduledDate={load.scheduledDate}
                status={load.status}
                orderCount={load.orders.length}
                deliveredCount={load.orders.filter(({ order }) => order.currentStatus === "DELIVERED").length}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
