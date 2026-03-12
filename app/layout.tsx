import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "VEXOR Entregas",
  description: "Portal logístico operacional e mobile para a VEXOR."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
