import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatBRL } from "@/lib/masks";
import type { Negotiation } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, negotiationTone } from "@/components/ui/Badge";
import { NEGOTIATION_STATUS_LABEL } from "@/lib/constants";
import { Select } from "@/components/ui/fields";

type NegotiationWithRelations = Negotiation & {
  request?: { protocol: string; company?: { tradeName: string } };
};

export function Negociacoes() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["negotiations"],
    queryFn: () =>
      api.get<{ negotiations: NegotiationWithRelations[] }>("/api/admin/negotiations"),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/admin/negotiations/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["negotiations"] }),
  });

  const negotiations = data?.negotiations ?? [];

  return (
    <div>
      <PageHeader
        title="Negociações"
        description="Conversas em andamento com parceiros para cada demanda."
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Solicitação</th>
                <th className="px-5 py-3 font-medium">Empresa</th>
                <th className="px-5 py-3 font-medium">Parceiro</th>
                <th className="px-5 py-3 font-medium">Diária</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    Carregando...
                  </td>
                </tr>
              ) : negotiations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    Nenhuma negociação em andamento.
                  </td>
                </tr>
              ) : (
                negotiations.map((n) => (
                  <tr key={n.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-5 py-3.5 font-mono text-xs text-brand">{n.request?.protocol}</td>
                    <td className="px-5 py-3.5 text-ink">{n.request?.company?.tradeName}</td>
                    <td className="px-5 py-3.5 text-muted">{n.partner?.tradeName}</td>
                    <td className="px-5 py-3.5 text-muted">
                      {n.offeredDailyRate != null ? formatBRL(n.offeredDailyRate) : "-"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Badge tone={negotiationTone(n.status)}>
                          {NEGOTIATION_STATUS_LABEL[n.status]}
                        </Badge>
                        <Select
                          value={n.status}
                          onChange={(e) => update.mutate({ id: n.id, status: e.target.value })}
                          className="h-8 w-36 text-xs"
                        >
                          {Object.entries(NEGOTIATION_STATUS_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </div>
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
