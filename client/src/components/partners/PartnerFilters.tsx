import { useMemo, useState } from "react";
import { CheckCircle, MagnifyingGlass, Users, X } from "@phosphor-icons/react";
import type { PartnerCategory } from "@/lib/types";
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, SERVICES } from "@/lib/constants";
import { Input } from "@/components/ui/fields";
import { cn } from "@/lib/cn";

export interface FilterablePartner {
  tradeName: string;
  address: string;
  category: PartnerCategory;
  availableCapacity: number;
  services?: string[];
}

const defaultSearchText = (p: FilterablePartner) => `${p.tradeName} ${p.address}`;

const normalize = (v: string) =>
  v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Estado e lógica dos filtros de parceiros (busca, nº de pessoas, categoria e comodidades).
 * `searchText` permite incluir campos extras na busca (ex.: CNPJ e contatos no admin).
 */
export function usePartnerFilters<T extends FilterablePartner>(
  items: T[],
  searchText: (p: T) => string = defaultSearchText,
) {
  const [search, setSearch] = useState("");
  const [guests, setGuests] = useState("");
  const [category, setCategory] = useState<PartnerCategory | "">("");
  const [services, setServices] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    const minGuests = Number(guests) || 0;

    return items.filter((p) => {
      if (term && !normalize(searchText(p)).includes(term)) return false;
      if (minGuests && p.availableCapacity < minGuests) return false;
      if (category && p.category !== category) return false;
      const partnerServices = p.services ?? [];
      return services.every((s) => partnerServices.includes(s));
    });
  }, [items, search, guests, category, services, searchText]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<PartnerCategory, number>> = {};
    items.forEach((p) => {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    });
    return counts;
  }, [items]);

  const toggleService = (value: string) =>
    setServices((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const hasFilters = Boolean(search || guests || category || services.length);

  const clear = () => {
    setSearch("");
    setGuests("");
    setCategory("");
    setServices([]);
  };

  return {
    filtered,
    total: items.length,
    categoryCounts,
    search,
    setSearch,
    guests,
    setGuests,
    category,
    setCategory,
    services,
    toggleService,
    hasFilters,
    clear,
  };
}

export type PartnerFiltersState = ReturnType<typeof usePartnerFilters>;

export function PartnerFilters({
  state,
  searchPlaceholder = "Buscar por nome ou endereço",
  extra,
  extraActive = false,
  onClearExtra,
  shown,
  loading = false,
}: {
  state: PartnerFiltersState;
  searchPlaceholder?: string;
  /** Controle adicional ao lado da busca (ex.: filtro de status no admin). */
  extra?: React.ReactNode;
  extraActive?: boolean;
  onClearExtra?: () => void;
  /** Quantidade exibida, quando há filtros adicionais aplicados fora do hook. */
  shown?: number;
  loading?: boolean;
}) {
  const count = shown ?? state.filtered.length;
  const anyFilter = state.hasFilters || extraActive;

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <CategoryChip active={state.category === ""} onClick={() => state.setCategory("")}>
          Todas <span className="text-muted">({state.total})</span>
        </CategoryChip>
        {PARTNER_CATEGORIES.map((c) => (
          <CategoryChip key={c} active={state.category === c} onClick={() => state.setCategory(c)}>
            {PARTNER_CATEGORY_LABEL[c]}{" "}
            <span className="text-muted">({state.categoryCounts[c] ?? 0})</span>
          </CategoryChip>
        ))}
      </div>

      <div className="mb-6 space-y-4 rounded-2xl border border-border bg-white p-4 sm:p-5">
        <div className={cn("grid gap-3", extra ? "sm:grid-cols-[1fr_180px_180px]" : "sm:grid-cols-[1fr_200px]")}>
          <div className="relative">
            <MagnifyingGlass
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              value={state.search}
              onChange={(e) => state.setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Buscar parceiros"
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
              value={state.guests}
              onChange={(e) => state.setGuests(e.target.value)}
              placeholder="Nº de pessoas"
              aria-label="Quantidade de pessoas a hospedar"
              className="pl-10"
            />
          </div>
          {extra}
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Comodidades</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {SERVICES.map((s) => {
              const active = state.services.includes(s.value);
              return (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => state.toggleService(s.value)}
                  aria-pressed={active}
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
            {loading
              ? "Carregando..."
              : `${count} de ${state.total} parceiro${state.total === 1 ? "" : "s"}`}
          </span>
          {anyFilter && (
            <button
              type="button"
              onClick={() => {
                state.clear();
                onClearExtra?.();
              }}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              <X size={14} /> Limpar filtros
            </button>
          )}
        </div>
      </div>
    </>
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
      aria-pressed={active}
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
