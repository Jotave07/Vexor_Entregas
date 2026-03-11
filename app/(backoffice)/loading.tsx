import { PageLoader } from "@/components/ui/page-loader";

export default function BackofficeLoading() {
  return (
    <PageLoader
      compact
      title="Atualizando painel"
      message="Sincronizando pedidos, cargas e motoristas para a proxima tela."
    />
  );
}
