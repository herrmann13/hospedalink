import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardText,
  ArrowsLeftRight,
  FileText,
  Buildings,
  UsersThree,
  CurrencyDollar,
  TrendUp,
} from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { formatBRL, formatDateTime } from "@/lib/masks";
import type { DashboardStats, AccommodationRequest } from "@/lib/types";
import { StatCard } from "@/components/admin/StatCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, requestTone } from "@/components/ui/Badge";
import { REQUEST_STATUS_LABEL } from "@/lib/constants";

export function Dashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<{ stats: DashboardStats }>("/api/admin/dashboard"),
  });

  const { data: requestsData } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.get<{ requests: AccommodationRequest[] }>("/api/admin/requests"),
  });

  const stats = statsData?.stats;
  const recent = (requestsData?.requests ?? []).slice(0, 5);

  const cards = [
    { label: "Solicitações abertas", value: String(stats?.openRequests ?? 0), icon: ClipboardText },
    { label: "Em negociação", value: String(stats?.negotiatingRequests ?? 0), icon: ArrowsLeftRight },
    { label: "Contratos ativos", value: String(stats?.activeContracts ?? 0), icon: FileText, accent: true },
    { label: "Parceiros cadastrados", value: String(stats?.partners ?? 0), icon: Buildings },
    { label: "Hóspedes hospedados", value: String(stats?.activeGuests ?? 0), icon: UsersThree },
    { label: "Valor total negociado", value: formatBRL(stats?.totalNegotiated ?? 0), icon: CurrencyDollar },
    { label: "Receita estimada em taxas", value: formatBRL(stats?.estimatedRevenue ?? 0), icon: TrendUp, accent: true },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação de hospedagem corporativa."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} accent={card.accent} />
        ))}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Solicitações recentes</h2>
          <Link to="/admin/solicitacoes" className="text-sm font-medium text-brand hover:text-brand-800">
            Ver todas
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted">Carregando...</div>
          ) : recent.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">Nenhuma solicitação ainda.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Protocolo</th>
                  <th className="px-5 py-3 font-medium">Empresa</th>
                  <th className="px-5 py-3 font-medium">Pessoas</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Criada em</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-5 py-3.5 font-mono text-xs text-brand">
                      <Link to={`/admin/solicitacoes/${r.id}`} className="hover:underline">
                        {r.protocol}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink">{r.company?.tradeName}</td>
                    <td className="px-5 py-3.5 text-muted">{r.numberOfGuests}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={requestTone(r.status)}>{REQUEST_STATUS_LABEL[r.status]}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
