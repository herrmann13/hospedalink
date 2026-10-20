import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Eye, Image, PencilSimple, Plus, SpinnerGap, Trash } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import type { Partner, PartnerStatus } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, partnerTone } from "@/components/ui/Badge";
import { PARTNER_CATEGORY_LABEL, PARTNER_STATUS_LABEL, SERVICE_LABEL } from "@/lib/constants";
import { Button, LinkButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
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

  const [toDelete, setToDelete] = useState<Partner | null>(null);

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
                        <RowActions
                          label={`Ações de ${p.tradeName}`}
                          actions={[
                            { label: "Ver cadastro", icon: <Eye size={16} />, to: `/admin/parceiros/${p.id}` },
                            { label: "Fotos", icon: <Image size={16} />, to: `/admin/parceiros/${p.id}#fotos` },
                            { label: "Editar", icon: <PencilSimple size={16} />, to: `/admin/parceiros/${p.id}/editar` },
                            ...(p.status === "PENDING"
                              ? [
                                  {
                                    label: "Aprovar",
                                    icon: <CheckCircle size={16} />,
                                    onClick: () => approve.mutate(p.id),
                                  } satisfies RowAction,
                                ]
                              : []),
                            {
                              label: "Excluir",
                              icon: <Trash size={16} />,
                              danger: true,
                              onClick: () => setToDelete(p),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeletePartnerModal partner={toDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}

function DeletePartnerModal({ partner, onClose }: { partner: Partner | null; onClose: () => void }) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/partners/${id}`),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ["partner", id] });
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
  });

  const close = () => {
    if (remove.isPending) return;
    remove.reset();
    onClose();
  };

  return (
    <Modal open={partner !== null} onClose={close} title="Excluir parceiro">
      {partner && (
        <div>
          <p className="text-sm leading-relaxed text-muted">
            Tem certeza que deseja excluir <span className="font-semibold text-ink">{partner.tradeName}</span>?
            Os quartos, comodidades e fotos também serão removidos. Esta ação não pode ser desfeita.
          </p>
          {remove.error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{remove.error.message}</p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={close} disabled={remove.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => remove.mutate(partner.id)}
              disabled={remove.isPending}
              variant="danger"
            >
              {remove.isPending ? <SpinnerGap size={16} className="animate-spin" /> : <Trash size={16} />}
              Excluir
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
