import { UserRole } from "@prisma/client";
import { AdminDriverForm } from "@/components/forms/admin-driver-form";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { driverStatusLabels, driverTypeLabels } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const session = await requireAuth();
  const drivers = await prisma.driverProfile.findMany({
    include: {
      user: true,
      loads: {
        where: {
          status: {
            in: ["OPEN", "IN_TRANSIT"]
          }
        }
      }
    },
    orderBy: { fullName: "asc" }
  });

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-sm font-medium text-slate-500">Base de motoristas</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Motoristas sincronizados para a operação</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          O fluxo preferencial é receber os cadastros do Winthor via n8n. O cadastro manual abaixo é apenas contingência de
          administrador para não travar a operação.
        </p>
      </section>

      {session.role === UserRole.ADMIN ? (
        <AdminDriverForm />
      ) : (
        <section className="panel p-6 text-sm text-slate-600">
          Apenas administradores podem criar cadastros manuais de contingência. Os demais perfis acompanham aqui os
          motoristas já sincronizados para a execução.
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        {drivers.map((driver) => (
          <div key={driver.id} className="panel p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{driverTypeLabels[driver.type]}</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">{driver.fullName}</h2>
              </div>
              <StatusBadge label={driverStatusLabels[driver.status]} tone={driver.status === "ACTIVE" ? "green" : "slate"} />
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-900">Documento:</span> {driver.document}</p>
              <p><span className="font-semibold text-slate-900">Telefone:</span> {driver.phone ?? "-"}</p>
              <p><span className="font-semibold text-slate-900">Veículo:</span> {driver.vehicleType ?? "-"} / {driver.vehiclePlate ?? "-"}</p>
              <p><span className="font-semibold text-slate-900">Login:</span> {driver.user?.email ?? "Sem usuário vinculado"}</p>
              <p><span className="font-semibold text-slate-900">Origem ERP:</span> {driver.integrationRef ?? "Cadastro local de contingência"}</p>
              <p><span className="font-semibold text-slate-900">Última sincronização:</span> {formatDate(driver.syncedAt)}</p>
              <p><span className="font-semibold text-slate-900">Cargas em execução:</span> {driver.loads.length}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
