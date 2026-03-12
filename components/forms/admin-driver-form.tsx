"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DriverStatus, DriverType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { driverStatusLabels, driverTypeLabels } from "@/lib/status";

function parseApiError(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  return "Não foi possível concluir o cadastro.";
}

export function AdminDriverForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: formData.get("fullName"),
      document: formData.get("document"),
      phone: formData.get("phone"),
      vehicleType: formData.get("vehicleType"),
      vehiclePlate: formData.get("vehiclePlate"),
      type: formData.get("type"),
      status: formData.get("status"),
      email: formData.get("email"),
      password: formData.get("password")
    };

    const response = await fetch("/api/drivers", {
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

    setSuccess("Motorista de contingência cadastrado com sucesso.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-500">Contingência administrativa</p>
        <h2 className="text-2xl font-semibold text-slate-950">Cadastro manual de motorista</h2>
        <p className="text-sm text-slate-500">
          Use este formulário somente quando o cadastro não puder chegar do Winthor via n8n a tempo de liberar a operação.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Nome completo
          <Input name="fullName" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Documento
          <Input name="document" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Telefone
          <Input name="phone" />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Tipo de motorista
          <Select name="type" defaultValue={DriverType.AGGREGATED}>
            {Object.values(DriverType).map((type) => (
              <option key={type} value={type}>
                {driverTypeLabels[type]}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Tipo de veículo
          <Input name="vehicleType" placeholder="Ex.: Carreta, VUC, Fiorino" />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Placa
          <Input name="vehiclePlate" />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Status
          <Select name="status" defaultValue={DriverStatus.ACTIVE}>
            {Object.values(DriverStatus).map((status) => (
              <option key={status} value={status}>
                {driverStatusLabels[status]}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950">Acesso do motorista</p>
        <p className="mt-1 text-sm text-slate-500">Preencha e-mail e senha apenas se quiser liberar o acesso web imediatamente.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Email
            <Input name="email" type="email" placeholder="motorista@vexor.com.br" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Senha
            <Input name="password" type="password" placeholder="Mínimo de 6 caracteres" />
          </label>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

      <div className="mt-6">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando motorista..." : "Cadastrar motorista de contingência"}
        </Button>
      </div>
    </form>
  );
}
