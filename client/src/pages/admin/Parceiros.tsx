import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import type { Partner, PartnerStatus } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, partnerTone } from "@/components/ui/Badge";
import { PARTNER_CATEGORY_LABEL, PARTNER_STATUS_LABEL, SERVICE_LABEL } from "@/lib/constants";
import { Button, LinkButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/fields";
import { PartnerFilters, usePartnerFilters } from "@/components/partners/PartnerFilters";
import { maskCnpj } from "@/lib/masks";
import { cn } from "@/lib/cn";

const STATUSES = Object.keys(PARTNER_STATUS_LABEL) as PartnerStatus[];
const MAX_SERVICES_IN_ROW = 3;

const adminSearchText = (p: Partner) =>
  [p.tradeName, p.legalName, p.address, p.contactName, p.email, p.cnpj, maskCnpj(p.cnpj)].join(" ");

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

  const filters = usePartnerFilters(data?.partners ?? [], adminSearchText);
  const [status, setStatus] = useState<PartnerStatus | "">("");
  const partners = filters.filtered.filter((p) => !status || p.status === status);
  const selectedServices = filters.services;

  return (
    <div>
      <PageHeader
        title="Parceiros"
        description="Hotéis, pousadas e alojamentos cadastrados."
        action={
          <LinkButton to="/admin/parceiros/novo">
            <Plus size={16} />
            Novo parceiro
          </LinkButton>
        }
      />

      <PartnerFilters
        state={filters}
        searchPlaceholder="Buscar por nome, endereço, responsável ou CNPJ"
        shown={partners.length}
        loading={isLoading}
        extraActive={Boolean(status)}
        onClearExtra={() => setStatus("")}
        extra={
          <Select value={status} onChange={(e) => setStatus(e.target.value as PartnerStatus | "")}>
            <option value="">Todos os status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {PARTNER_STATUS_LABEL[s]}
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
                <th className="px-5 py-3 font-medium">Estabelecimento</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Vagas</th>
                <th className="px-5 py-3 font-medium">Comodidades</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted">
                    Carregando...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted">
                    {filters.total === 0
                      ? "Nenhum parceiro cadastrado."
                      : "Nenhum parceiro encontrado com esses filtros."}
                  </td>
                </tr>
              ) : (
                partners.map((p) => {
                  const partnerServices = p.services ?? [];
                  const highlighted = [
                    ...partnerServices.filter((s) => selectedServices.includes(s)),
                    ...partnerServices.filter((s) => !selectedServices.includes(s)),
                  ];
                  const extra = highlighted.length - MAX_SERVICES_IN_ROW;
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                      <td className="px-5 py-3.5">
                        <Link to={`/admin/parceiros/${p.id}`} className="font-medium text-ink hover:text-brand">
                          {p.tradeName}
                        </Link>
                        <p className="text-xs text-muted">{p.address}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone="brand">{PARTNER_CATEGORY_LABEL[p.category] ?? p.category}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted">{p.availableCapacity}</td>
                      <td className="px-5 py-3.5">
                        {highlighted.length === 0 ? (
                          <span className="text-xs text-muted">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {highlighted.slice(0, MAX_SERVICES_IN_ROW).map((s) => (
                              <span
                                key={s}
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-xs",
                                  selectedServices.includes(s)
                                    ? "bg-accent-soft text-accent-strong"
                                    : "bg-surface-2 text-muted",
                                )}
                              >
                                {SERVICE_LABEL[s] ?? s}
                              </span>
                            ))}
                            {extra > 0 && (
                              <span
                                className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted"
                                title={highlighted
                                  .slice(MAX_SERVICES_IN_ROW)
                                  .map((s) => SERVICE_LABEL[s] ?? s)
                                  .join(", ")}
                              >
                                +{extra}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
