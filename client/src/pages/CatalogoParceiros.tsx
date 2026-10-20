import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Buildings, MapPin, Users } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import type { PublicPartner } from "@/lib/types";
import { PARTNER_CATEGORY_LABEL, SERVICE_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { PartnerFilters, usePartnerFilters } from "@/components/partners/PartnerFilters";
import { startingPrice } from "@/components/partners/startingPrice";
import { cn } from "@/lib/cn";

const MAX_SERVICES_IN_CARD = 4;

export function CatalogoParceiros() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-partners"],
    queryFn: () => api.get<{ partners: PublicPartner[] }>("/api/partners"),
  });

  const filters = usePartnerFilters(data?.partners ?? []);

  return (
    <div className="pt-20">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Parceiros</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            Hotéis, pousadas e alojamentos em Jataí preparados para receber equipes. Filtre pela
            quantidade de pessoas e pelas comodidades que sua equipe precisa.
            Preços e capacidade são referenciais; confirme as condições para seu período com a Hospeda Link.
          </p>
        </div>

        <PartnerFilters state={filters} loading={isLoading} />

        {isError ? (
            <><EmptyState text="Não foi possível carregar os parceiros." /><button type="button" onClick={() => void refetch()} className="mt-4 text-brand underline">Tentar novamente</button></>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : filters.filtered.length === 0 ? (
          <EmptyState
            text={
              filters.total === 0
                ? "Nenhum parceiro disponível no momento."
                : "Nenhum parceiro encontrado com esses filtros."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filters.filtered.map((p) => (
              <PartnerCard key={p.id} partner={p} highlight={filters.services} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PartnerCard({ partner, highlight }: { partner: PublicPartner; highlight: string[] }) {
  const cover = partner.images[0]?.imageUrl;
  const price = startingPrice(partner);
  const services = [
    ...partner.services.filter((s) => highlight.includes(s)),
    ...partner.services.filter((s) => !highlight.includes(s)),
  ];
  const extra = services.length - MAX_SERVICES_IN_CARD;

  return (
    <Link
      to={`/parceiros/${partner.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-card"
    >
      <div className="relative aspect-[4/3] bg-surface-2">
        {cover ? (
          <img
            src={cover}
            alt={partner.tradeName}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <Buildings size={40} />
          </div>
        )}
        <Badge tone="brand" className="absolute left-3 top-3 shadow-sm">
          {PARTNER_CATEGORY_LABEL[partner.category] ?? partner.category}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-semibold text-ink group-hover:text-brand">{partner.tradeName}</h2>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
          <MapPin size={16} className="mt-0.5 shrink-0" />
          {partner.address}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
          <Users size={16} className="shrink-0" />
          Até {partner.availableCapacity} pessoa{partner.availableCapacity === 1 ? "" : "s"}
        </p>

        {services.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {services.slice(0, MAX_SERVICES_IN_CARD).map((s) => (
              <span
                key={s}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs",
                  highlight.includes(s) ? "bg-accent-soft text-accent-strong" : "bg-surface-2 text-muted",
                )}
              >
                {SERVICE_LABEL[s] ?? s}
              </span>
            ))}
            {extra > 0 && (
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">+{extra}</span>
            )}
          </div>
        )}

        {price && (
          <p className="mt-auto pt-5 text-sm text-muted">
            A partir de <span className="text-base font-semibold text-ink">{price.value}</span>{" "}
            {price.label && <span>· {price.label}</span>}
          </p>
        )}
      </div>
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center text-muted">
      {text}
      <Link to="/solicitar-hospedagem" className="mt-4 block font-semibold text-brand underline">Solicitar cotação para minha equipe</Link>
    </div>
  );
}
