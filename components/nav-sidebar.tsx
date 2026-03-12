"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Truck, Users, LayoutDashboard, Workflow, LogOut } from "lucide-react";
import { type SessionUser } from "@/lib/auth";
import { roleLabels } from "@/lib/status";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loads", label: "Cargas importadas", icon: Truck },
  { href: "/orders", label: "Pedidos sincronizados", icon: Package },
  { href: "/drivers", label: "Motoristas", icon: Users },
  { href: "/driver", label: "Portal do motorista", icon: Workflow }
];

export function NavSidebar({ session }: { session: SessionUser }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST"
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="panel-dark flex h-full flex-col gap-8 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-brand-100/70">Operação</p>
        <h2 className="mt-3 text-2xl font-semibold">VEXOR Entregas</h2>
        <p className="mt-2 text-sm text-brand-100/80">{session.name}</p>
        <p className="text-xs text-brand-100/70">{roleLabels[session.role]}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-brand-100/85 transition hover:bg-white/10 hover:text-white"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <Button type="button" variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </aside>
  );
}
