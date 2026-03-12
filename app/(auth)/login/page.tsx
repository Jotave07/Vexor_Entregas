import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="panel-dark relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-grid bg-[size:32px_32px] opacity-20" />
        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-brand-100/80">portal logístico</p>
          <h2 className="mt-6 text-5xl font-semibold leading-tight">Operação de entrega conectada ao Winthor e ao n8n.</h2>
          <p className="mt-6 text-lg text-brand-100/80">
            Plataforma oficial da VEXOR para acompanhar cargas prontas, gerir a rua por motorista e consolidar status,
            ocorrências e comprovantes com rastreabilidade operacional.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
            <p className="text-sm text-brand-100/70">Origem</p>
            <p className="mt-2 text-2xl font-semibold">Winthor</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
            <p className="text-sm text-brand-100/70">Orquestração</p>
            <p className="mt-2 text-2xl font-semibold">n8n</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
            <p className="text-sm text-brand-100/70">Execução</p>
            <p className="mt-2 text-2xl font-semibold">Motorista</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-12">
        <LoginForm />
      </section>
    </main>
  );
}
