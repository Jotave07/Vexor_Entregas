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
    <section className="panel p-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-500">Politica operacional</p>
        <h2 className="text-2xl font-semibold text-slate-950">Cargas manuais desativadas</h2>
        <p className="text-sm text-slate-500">
          O portal trabalha com cargas recebidas e acompanhadas operacionalmente. A abertura manual permanece bloqueada.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="panel-edge p-4">
          <p className="text-sm font-semibold text-slate-950">Carga recebida</p>
          <p className="mt-2 text-sm text-slate-600">Acompanhamento apenas de cargas ja cadastradas na operacao.</p>
        </div>
        <div className="panel-edge p-4">
          <p className="text-sm font-semibold text-slate-950">Motoristas ativos</p>
          <p className="mt-2 text-sm text-slate-600">{drivers.length} disponiveis para vinculo nas cargas recebidas.</p>
        </div>
        <div className="panel-edge p-4">
          <p className="text-sm font-semibold text-slate-950">Pedidos sem carga</p>
          <p className="mt-2 text-sm text-slate-600">{availableOrders.length} aguardando tratamento operacional.</p>
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700"
        >
          {expanded ? "Ocultar checklist operacional" : "Exibir checklist operacional"}
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="panel-edge p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-950">1. Confirmar a carga</p>
            <p className="mt-2">Valide se a carga foi recebida e se os pedidos estao completos.</p>
          </div>
          <div className="panel-edge p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-950">2. Confirmar motorista e pedidos</p>
            <p className="mt-2">Valide o vinculo do motorista e a consistencia dos pedidos recebidos.</p>
          </div>
          <div className="panel-edge p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-950">3. Acionar contingencia formal</p>
            <p className="mt-2">Em excecoes criticas, trate o caso fora do fluxo padrao do sistema.</p>
          </div>
          <div className="panel-edge p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-950">4. Reprocessar a carga</p>
            <p className="mt-2">Apos a correcao, reenvie a carga completa para acompanhamento normal.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
