import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Partner } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { PartnerForm } from "@/components/form/PartnerForm";

/** /admin/parceiros/novo e /admin/parceiros/:id/editar */
export function ParceiroForm() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["partner", id],
    queryFn: () => api.get<{ partner: Partner }>(`/api/admin/partners/${id}`),
    enabled: Boolean(id),
  });

  if (id && (isLoading || !data)) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  const partner = data?.partner;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        backTo={partner ? `/admin/parceiros/${partner.id}` : "/admin/parceiros"}
        title={partner ? `Editar ${partner.tradeName}` : "Novo parceiro"}
        description={
          partner
            ? "Atualize os dados, quartos e comodidades do estabelecimento."
            : "Cadastre um estabelecimento. As fotos são adicionadas na página do parceiro após salvar."
        }
      />
      <PartnerForm key={partner?.id ?? "novo"} partner={partner} />
    </div>
  );
}
