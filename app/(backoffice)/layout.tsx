import { NavSidebar } from "@/components/nav-sidebar";
import { Topbar } from "@/components/topbar";
import { requireAuth } from "@/lib/auth";

export default async function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="grid min-h-[calc(100vh-2rem)] gap-4 md:grid-cols-[280px_1fr]">
        <NavSidebar session={session} />
        <main className="space-y-6 rounded-[2rem] bg-white/55 p-4 backdrop-blur md:p-6">
          <Topbar />
          {children}
        </main>
      </div>
    </div>
  );
}
