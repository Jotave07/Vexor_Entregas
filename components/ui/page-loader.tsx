type PageLoaderProps = {
  title?: string;
  message?: string;
  compact?: boolean;
};

export function PageLoader({
  title = "Carregando pagina",
  message = "Buscando informacoes e preparando a proxima tela.",
  compact = false
}: PageLoaderProps) {
  return (
    <div
      className={
        compact
          ? "flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed border-slate-200 bg-white/70 p-8 text-center"
          : "flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center"
      }
    >
      <div className="relative">
        <div className="vexor-spinner h-14 w-14" />
        <div className="absolute inset-[11px] rounded-full bg-white/70" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="max-w-md text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}
