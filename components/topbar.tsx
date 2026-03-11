import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">Portal logístico VEXOR</p>
        <h2 className="text-2xl font-semibold text-slate-950">Acompanhamento de cargas e entregas</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-10" placeholder="Buscar pedido, carga ou motorista" />
        </div>
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
