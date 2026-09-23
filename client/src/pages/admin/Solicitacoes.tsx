import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/masks";
import type { AccommodationRequest } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, requestTone } from "@/components/ui/Badge";
import { REQUEST_STATUS_LABEL } from "@/lib/constants";
import { Select } from "@/components/ui/fields";

const STATUSES = Object.keys(REQUEST_STATUS_LABEL) as (keyof typeof REQUEST_STATUS_LABEL)[];

export function Solicitacoes() {
  const { data, isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.get<{ requests: AccommodationRequest[] }>("/api/admin/requests"),
  });
  const [filter, setFilter] = useState("");

  const requests = (data?.requests ?? []).filter((r) => !filter || r.status === filter);

  return (
    <div>
      <PageHeader
        title="Solicitações"
        description="Demandas de hospedagem recebidas de empresas."
        action={
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full sm:w-56">
            <option value="">Todos os status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {REQUEST_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Protocolo</th>
                <th className="px-5 py-3 font-medium">Empresa</th>
                <th className="px-5 py-3 font-medium">Responsável</th>
                <th className="px-5 py-3 font-medium">Pessoas</th>
                <th className="px-5 py-3 font-medium">Entrada</th>
                <th className="px-5 py-3 font-medium">Saída</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    Carregando...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-5 py-3.5 font-mono text-xs text-brand">
                      <Link to={`/admin/solicitacoes/${r.id}`} className="hover:underline">
                        {r.protocol}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink">{r.company?.tradeName}</td>
                    <td className="px-5 py-3.5 text-muted">{r.company?.contactName}</td>
                    <td className="px-5 py-3.5 text-muted">{r.numberOfGuests}</td>
                    <td className="px-5 py-3.5 text-muted">{formatDate(r.checkIn)}</td>
                    <td className="px-5 py-3.5 text-muted">{formatDate(r.checkOut)}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={requestTone(r.status)}>{REQUEST_STATUS_LABEL[r.status]}</Badge>
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
