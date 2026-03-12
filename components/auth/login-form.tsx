"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginResponse = {
  error?: string;
  success?: boolean;
};

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password")
        })
      });

      const responseText = await response.text();
      const payload: LoginResponse = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        setError(payload.error ?? "Não foi possível entrar.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Não foi possível entrar no momento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel flex w-full max-w-md flex-col gap-5 p-7">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand-600">Acesso seguro</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">Entrar no portal</h2>
        <p className="mt-2 text-sm text-slate-500">Use seu login individual para acessar o fluxo operacional ou a área do motorista.</p>
      </div>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Email
        <Input name="email" type="email" placeholder="voce@vexor.com.br" required />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Senha
        <Input name="password" type="password" placeholder="••••••••" required />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>

      <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-900">Acessos do portal</p>
        <p>Administrador: `admin@vexor.com.br`</p>
        <p>Motorista: `motorista@vexor.com.br`</p>
        <p className="mt-3 font-medium text-slate-900">Contato</p>
        <p>CEO: João Vitor Vieira</p>
        <p>Telefone: `27 99528-8081`</p>
        <p className="mt-2 text-xs text-slate-500">As senhas e liberações devem ser administradas internamente pela VEXOR.</p>
      </div>
    </form>
  );
}
