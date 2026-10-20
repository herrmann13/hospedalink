import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, MagnifyingGlass, Users, X } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import type { Partner, PartnerCategory, PartnerStatus } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, partnerTone } from "@/components/ui/Badge";
import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABEL,
  PARTNER_STATUS_LABEL,
  SERVICES,
  SERVICE_LABEL,
} from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/fields";
import { onlyDigits } from "@/lib/masks";
import { cn } from "@/lib/cn";

const STATUSES = Object.keys(PARTNER_STATUS_LABEL) as PartnerStatus[];
const MAX_SERVICES_IN_ROW = 3;

const normalize = (v: string) =>
  v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

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

  const [search, setSearch] = useState("");
  const [guests, setGuests] = useState("");
  const [category, setCategory] = useState<PartnerCategory | "">("");
  const [status, setStatus] = useState<PartnerStatus | "">("");
  const [services, setServices] = useState<string[]>([]);

  const allPartners = data?.partners ?? [];

  const partners = useMemo(() => {
    const term = normalize(search.trim());
    const digits = onlyDigits(search);
    const minGuests = Number(guests) || 0;

    return allPartners.filter((p) => {
      if (term) {
        const haystack = normalize(
          [p.tradeName, p.legalName, p.address, p.contactName, p.email].join(" "),
        );
        const matchesCnpj = digits.length >= 3 && p.cnpj.includes(digits);
        if (!haystack.includes(term) && !matchesCnpj) return false;
      }
      if (minGuests && p.availableCapacity < minGuests) return false;
      if (category && p.category !== category) return false;
      if (status && p.status !== status) return false;
      const partnerServices: string[] = p.services ?? [];
      if (!services.every((s) => partnerServices.includes(s))) return false;
      return true;
    });
  }, [allPartners, search, guests, category, status, services]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<PartnerCategory, number>> = {};
    allPartners.forEach((p) => {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    });
    return counts;
  }, [allPartners]);

  const toggleService = (value: string) =>
    setServices((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const hasFilters = Boolean(search || guests || category || status || services.length);

  const clearFilters = () => {
    setSearch("");
    setGuests("");
    setCategory("");
    setStatus("");
    setServices([]);
  };

  return (
    <div>
      <PageHeader
        title="Parceiros"
        description="Hotéis, pousadas e alojamentos cadastrados."
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <CategoryChip active={category === ""} onClick={() => setCategory("")}>
          Todas <span className="text-muted">({allPartners.length})</span>
        </CategoryChip>
        {PARTNER_CATEGORIES.map((c) => (
          <CategoryChip key={c} active={category === c} onClick={() => setCategory(c)}>
            {PARTNER_CATEGORY_LABEL[c]}{" "}
            <span className="text-muted">({categoryCounts[c] ?? 0})</span>
          </CategoryChip>
        ))}
      </div>

      <div className="mb-6 space-y-4 rounded-2xl border border-border bg-white p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <MagnifyingGlass
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, endereço, responsável ou CNPJ"
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Users
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="Nº de pessoas"
              aria-label="Quantidade de pessoas a hospedar"
              className="pl-10"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as PartnerStatus | "")}>
            <option value="">Todos os status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {PARTNER_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Comodidades</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {SERVICES.map((s) => {
              const active = services.includes(s.value);
              return (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => toggleService(s.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-border bg-white text-muted hover:border-brand-600 hover:text-ink",
                  )}
                >
                  {active && <CheckCircle size={14} weight="fill" />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted">
            {isLoading
              ? "Carregando..."
              : `${partners.length} de ${allPartners.length} parceiro${allPartners.length === 1 ? "" : "s"}`}
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              <X size={14} /> Limpar filtros
            </button>
          )}
        </div>
      </div>

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
                    {allPartners.length === 0
                      ? "Nenhum parceiro cadastrado."
                      : "Nenhum parceiro encontrado com esses filtros."}
                  </td>
                </tr>
              ) : (
                partners.map((p) => {
                  const partnerServices = p.services ?? [];
                  const highlighted = [
                    ...partnerServices.filter((s) => services.includes(s)),
                    ...partnerServices.filter((s) => !services.includes(s)),
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
                                  services.includes(s)
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

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand bg-brand text-white [&_span]:text-white/70"
          : "border-border bg-white text-ink hover:border-brand-600",
      )}
    >
      {children}
    </button>
  );
}
