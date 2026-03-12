"use client";

import { useState } from "react";
import type { DriverProfile, Order } from "@prisma/client";

type AdminLoadFormProps = {
  drivers: Pick<DriverProfile, "id" | "fullName">[];
  availableOrders: Pick<Order, "id" | "erpOrderNumber" | "customerName">[];
};

export function AdminLoadForm({ drivers, availableOrders }: AdminLoadFormProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="panel p-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-500">Política operacional</p>
        <h2 className="text-2xl font-semibold text-slate-950">Cargas manuais desativadas</h2>
        <p className="text-sm text-slate-500">
          A operação padrão da VEXOR usa cargas prontas vindas do Winthor via n8n. O portal não deve mais abrir cargas
          manualmente.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="panel-edge p-4">
          <p className="text-sm font-semibold text-slate-950">Origem obrigatória</p>
          <p className="mt-2 text-sm text-slate-600">Winthor {"->"} n8n {"->"} VEXOR Entregas.</p>
        </div>
        <div className="panel-edge p-4">
          <p className="text-sm font-semibold text-slate-950">Motoristas ativos</p>
          <p className="mt-2 text-sm text-slate-600">{drivers.length} disponíveis para vínculo nas cargas importadas.</p>
        </div>
        <div className="panel-edge p-4">
          <p className="text-sm font-semibold text-slate-950">Pedidos sem carga</p>
          <p className="mt-2 text-sm text-slate-600">{availableOrders.length} aguardando tratamento da integração.</p>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700"
        >
          {expanded ? "Ocultar checklist operacional" : "Exibir checklist operacional"}
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="panel-edge p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-950">1. Confirmar a falha no n8n</p>
            <p className="mt-2">Valide se a carga foi recebida do Winthor e em que etapa a sincronização falhou.</p>
          </div>
          <div className="panel-edge p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-950">2. Confirmar motorista e pedidos</p>
            <p className="mt-2">Os vínculos devem nascer da integração. O portal não deve virar origem paralela de dados.</p>
          </div>
          <div className="panel-edge p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-950">3. Acionar contingência formal</p>
            <p className="mt-2">Em exceções críticas, a abertura manual deve ser tratada fora do fluxo padrão do sistema.</p>
          </div>
          <div className="panel-edge p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-950">4. Reprocessar a integração</p>
            <p className="mt-2">Após a correção, reenvie a carga completa com pedidos já agrupados pelo fluxo Winthor + n8n.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
