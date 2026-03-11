"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DriverProfile, Order } from "@prisma/client";
import { LoadStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { loadStatusLabels } from "@/lib/status";

type AdminLoadFormProps = {
  drivers: Pick<DriverProfile, "id" | "fullName">[];
  availableOrders: Pick<Order, "id" | "erpOrderNumber" | "customerName">[];
};

function parseApiError(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  return "Não foi possível concluir o cadastro.";
}

export function AdminLoadForm({ drivers, availableOrders }: AdminLoadFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      code: formData.get("code"),
      title: formData.get("title"),
      routeDescription: formData.get("routeDescription"),
      notes: formData.get("notes"),
      driverId: formData.get("driverId") || undefined,
      scheduledDate: formData.get("scheduledDate") || undefined,
      status: formData.get("status"),
      orderIds: formData.getAll("orderIds")
    };

    const response = await fetch("/api/loads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(parseApiError(result.error));
      return;
    }

    setSuccess("Carga cadastrada com sucesso.");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="panel p-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-500">Cadastro administrativo</p>
        <h2 className="text-2xl font-semibold text-slate-950">Nova carga</h2>
        <p className="text-sm text-slate-500">Somente administradores podem abrir cargas e vincular pedidos.</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Código da carga
          <Input name="code" required placeholder="Ex.: CG-2026-010" />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Título
          <Input name="title" required placeholder="Ex.: Carga interior SP" />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Motorista
          <Select name="driverId" defaultValue="">
            <option value="">Sem motorista</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.fullName}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Status inicial
          <Select name="status" defaultValue={LoadStatus.OPEN}>
            {Object.values(LoadStatus).map((status) => (
              <option key={status} value={status}>
                {loadStatusLabels[status]}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
          Data programada
          <Input name="scheduledDate" type="datetime-local" />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
          Rota
          <Input name="routeDescription" placeholder="Ex.: Campinas, Sumaré e Hortolândia" />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
          Observações
          <Textarea name="notes" placeholder="Informações importantes da carga." />
        </label>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950">Pedidos disponíveis</p>
        <p className="mt-1 text-sm text-slate-500">Selecione os pedidos que ainda não foram vinculados a outra carga.</p>

        {availableOrders.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {availableOrders.map((order) => (
              <label key={order.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <input className="mt-1 h-4 w-4 rounded border-slate-300" type="checkbox" name="orderIds" value={order.id} />
                <span className="text-sm text-slate-700">
                  <strong className="block text-slate-950">{order.erpOrderNumber}</strong>
                  {order.customerName}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Não há pedidos livres para vincular neste momento.</p>
        )}
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

      <div className="mt-6">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando carga..." : "Cadastrar carga"}
        </Button>
      </div>
    </form>
  );
}
