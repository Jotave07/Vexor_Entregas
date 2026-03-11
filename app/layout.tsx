import type { Metadata } from "next";
import { Suspense } from "react";
import "@/app/globals.css";
import { NavigationProgressProvider } from "@/components/providers/navigation-progress";

export const metadata: Metadata = {
  title: "VEXOR Entregas",
  description: "Portal logistico operacional e mobile para a VEXOR."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <Suspense fallback={null}>
          <NavigationProgressProvider>{children}</NavigationProgressProvider>
        </Suspense>
      </body>
    </html>
  );
}
