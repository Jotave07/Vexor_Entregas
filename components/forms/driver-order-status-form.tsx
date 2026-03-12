"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { OccurrenceType, OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { occurrenceTypeLabels, orderStatusLabels } from "@/lib/status";

type DriverOrderStatusFormProps = {
  orderId: string;
  redirectPath: string;
  allowedStatuses: OrderStatus[];
  defaultStatus?: OrderStatus;
};

export function DriverOrderStatusForm({
  orderId,
  redirectPath,
  allowedStatuses,
  defaultStatus = "SAIU_PARA_ENTREGA"
}: DriverOrderStatusFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch(`/api/driver/orders/${orderId}/status`, {
        method: "POST",
        body: formData
      });

      const text = await response.text();
      const payload = text ? JSON.parse(text) : null;

      if (!response.ok) {
        setError(payload?.error ?? "Nao foi possivel salvar a atualizacao.");
        return;
      }

      router.push(payload?.redirectTo ?? redirectPath);
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError("Nao foi possivel salvar a atualizacao.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="mt-6 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Novo status</label>
        <Select name="status" defaultValue={defaultStatus}>
          {allowedStatuses.map((status) => (
            <option key={status} value={status}>
              {orderStatusLabels[status]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Observacao operacional</label>
        <Textarea name="notes" placeholder="Ex.: cliente recebeu sem ressalvas." />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Ocorrencia opcional</label>
        <Select name="occurrenceType" defaultValue="">
          <option value="">Sem ocorrencia</option>
          {Object.entries(occurrenceTypeLabels).map(([value, label]) => (
            <option key={value} value={value as OccurrenceType}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Comprovante</label>
        <input
          className="block w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm"
          type="file"
          name="proof"
          accept="image/*,.pdf"
        />
        <p className="mt-2 text-xs text-slate-500">Envie foto ou PDF. O arquivo sera registrado no portal para retorno operacional.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Nome do recebedor</label>
          <input className="block h-11 w-full rounded-lg border border-slate-300 px-4 text-sm" type="text" name="receiverName" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Documento do recebedor</label>
          <input className="block h-11 w-full rounded-lg border border-slate-300 px-4 text-sm" type="text" name="receiverDocument" />
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Atualizar entrega"}
      </Button>
    </form>
  );
}
