import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatBRL, formatDate } from "@/lib/masks";
import type { Contract } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, contractTone } from "@/components/ui/Badge";
import { CONTRACT_STATUS_LABEL } from "@/lib/constants";
import { Select } from "@/components/ui/fields";

type ContractWithRelations = Contract & {
  request?: { protocol: string };
};

export function Contratos() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => api.get<{ contracts: ContractWithRelations[] }>("/api/admin/contracts"),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/admin/contracts/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const contracts = data?.contracts ?? [];

  return (
    <div>
      <PageHeader
        title="Contratos"
        description="Contratos fechados a partir das propostas aceitas."
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Solicitação</th>
                <th className="px-5 py-3 font-medium">Empresa</th>
                <th className="px-5 py-3 font-medium">Parceiro</th>
                <th className="px-5 py-3 font-medium">Período</th>
                <th className="px-5 py-3 font-medium">Hospedagem</th>
                <th className="px-5 py-3 font-medium">Taxa</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted">
                    Carregando...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted">
                    Nenhum contrato ainda.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-5 py-3.5 font-mono text-xs text-brand">{c.request?.protocol}</td>
                    <td className="px-5 py-3.5 text-ink">{c.company?.tradeName}</td>
                    <td className="px-5 py-3.5 text-muted">{c.partner?.tradeName}</td>
                    <td className="px-5 py-3.5 text-muted">
                      {formatDate(c.checkIn)} - {formatDate(c.checkOut)}
                    </td>
                    <td className="px-5 py-3.5 text-muted">{formatBRL(c.accommodationAmount)}</td>
                    <td className="px-5 py-3.5 text-muted">{formatBRL(c.commissionAmount)}</td>
                    <td className="px-5 py-3.5 font-semibold text-ink">{formatBRL(c.totalAmount)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Badge tone={contractTone(c.status)}>{CONTRACT_STATUS_LABEL[c.status]}</Badge>
                        <Select
                          value={c.status}
                          onChange={(e) => update.mutate({ id: c.id, status: e.target.value })}
                          className="h-8 w-44 text-xs"
                        >
                          {Object.entries(CONTRACT_STATUS_LABEL).map(([k, v]) => (
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
