import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Partner } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, partnerTone } from "@/components/ui/Badge";
import { PARTNER_STATUS_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

export function Parceiros() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: () => api.get<{ partners: Partner[] }>("/api/admin/partners"),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.patch(`/api/admin/partners/${id}`, { status: "ACTIVE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const partners = data?.partners ?? [];

  return (
    <div>
      <PageHeader
        title="Parceiros"
        description="Hotéis, pousadas e alojamentos cadastrados."
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Estabelecimento</th>
                <th className="px-5 py-3 font-medium">Responsável</th>
                <th className="px-5 py-3 font-medium">Vagas</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    Carregando...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    Nenhum parceiro cadastrado.
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-5 py-3.5">
                      <Link to={`/admin/parceiros/${p.id}`} className="font-medium text-ink hover:text-brand">
                        {p.tradeName}
                      </Link>
                      <p className="text-xs text-muted">{p.address}</p>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{p.contactName}</td>
                    <td className="px-5 py-3.5 text-muted">{p.availableCapacity}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={partnerTone(p.status)}>{PARTNER_STATUS_LABEL[p.status]}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {p.status === "PENDING" && (
                        <Button size="sm" variant="accent" onClick={() => approve.mutate(p.id)}>
                          Aprovar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
