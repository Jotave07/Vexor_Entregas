import { PageLoader } from "@/components/ui/page-loader";

export default function DriverLoading() {
  return (
    <PageLoader
      compact
      title="Carregando entregas"
      message="Preparando suas cargas e os pedidos vinculados ao seu cadastro."
    />
  );
}
