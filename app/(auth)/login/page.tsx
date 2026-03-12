import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="panel-dark relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-grid bg-[size:32px_32px] opacity-20" />
        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-brand-100/80">operacao logistica</p>
          <h2 className="mt-6 text-5xl font-semibold leading-tight">Controle de cargas, entregas e comprovantes.</h2>
          <p className="mt-6 text-lg text-brand-100/80">
            Plataforma oficial da VEXOR para acompanhamento operacional em campo, com foco em cargas, entregas e retorno de comprovantes.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-3">
          <div className="rounded-md border border-white/10 bg-white/10 p-4">
            <p className="text-sm text-brand-100/70">Cargas</p>
            <p className="mt-2 text-2xl font-semibold">Roteiro do dia</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/10 p-4">
            <p className="text-sm text-brand-100/70">Entregas</p>
            <p className="mt-2 text-2xl font-semibold">Atualizacao em campo</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/10 p-4">
            <p className="text-sm text-brand-100/70">Retorno</p>
            <p className="mt-2 text-2xl font-semibold">Comprovantes</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-12">
        <LoginForm />
      </section>
    </main>
  );
}
