import { UserRole } from "@prisma/client";
import { AdminDriverForm } from "@/components/forms/admin-driver-form";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { driverStatusLabels, driverTypeLabels } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";

export default async function DriversPage() {
  const session = await requireAuth();
  const drivers = await prisma.driverProfile.findMany({
    include: {
      user: true,
      loads: true
    },
    orderBy: { fullName: "asc" }
  });

  return (
    <div className="space-y-6">
      {session.role === UserRole.ADMIN ? (
        <AdminDriverForm />
      ) : (
        <section className="panel p-6 text-sm text-slate-600">
          Apenas administradores podem criar cadastros manuais de contingencia. Seu perfil pode consultar abaixo os motoristas sincronizados e ativos na operacao.
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
              <p><span className="font-semibold text-slate-900">Veiculo:</span> {driver.vehicleType ?? "-"} / {driver.vehiclePlate ?? "-"}</p>
              <p><span className="font-semibold text-slate-900">Login:</span> {driver.user?.email ?? "Sem usuario vinculado"}</p>
              <p><span className="font-semibold text-slate-900">Origem ERP:</span> {driver.integrationRef ?? "Cadastro local/contingencia"}</p>
              <p><span className="font-semibold text-slate-900">Cargas:</span> {driver.loads.length}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
