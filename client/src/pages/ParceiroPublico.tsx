import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Buildings, CheckCircle, MapPin, Users } from "@phosphor-icons/react";
import { api, ApiError } from "@/lib/api";
import type { PublicPartner } from "@/lib/types";
import { PARTNER_CATEGORY_LABEL, PRICE_TYPES, SERVICE_LABEL } from "@/lib/constants";
import { formatBRL } from "@/lib/masks";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { startingPrice } from "@/components/partners/startingPrice";
import { cn } from "@/lib/cn";

export function ParceiroPublico() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["public-partner", id],
    queryFn: () => api.get<{ partner: PublicPartner }>(`/api/partners/${id}`),
    retry: false,
  });
  const [active, setActive] = useState(0);

  if (isLoading) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-36 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-ink">{error instanceof ApiError && error.status === 404 ? "Parceiro não encontrado" : "Não foi possível carregar o parceiro"}</h1>
        <p className="mt-3 text-muted">Você pode consultar outras opções ou solicitar uma cotação.</p>
        {!(error instanceof ApiError && error.status === 404) && <button type="button" onClick={() => void refetch()} className="mt-4 block mx-auto text-brand underline">Tentar novamente</button>}
        <LinkButton to="/parceiros" className="mt-8">
          Ver todos os parceiros
        </LinkButton>
      </div>
    );
  }

  const partner = data.partner;
  const images = partner.images;
  const price = startingPrice(partner);
  const priceLabel = (t: string) => PRICE_TYPES.find((p) => p.value === t)?.label ?? t;

  return (
    <div className="pt-20">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <Link
          to="/parceiros"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand"
        >
          <ArrowLeft size={16} />
          Todos os parceiros
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-surface-2">
              {images.length > 0 ? (
                <img
                  src={images[Math.min(active, images.length - 1)].imageUrl}
                  alt={`${partner.tradeName} - foto ${active + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">
                  <Buildings size={56} />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    className={cn(
                      "aspect-square overflow-hidden rounded-lg border-2 transition-colors",
                      i === active ? "border-accent" : "border-transparent hover:border-border",
                    )}
                  >
                    <img src={img.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Badge tone="brand">{PARTNER_CATEGORY_LABEL[partner.category] ?? partner.category}</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{partner.tradeName}</h1>
            <p className="mt-3 flex items-start gap-2 text-muted">
              <MapPin size={18} className="mt-0.5 shrink-0" />
              {partner.address}
            </p>
            <p className="mt-2 flex items-center gap-2 text-muted">
              <Users size={18} className="shrink-0" />
              Capacidade informada: até {partner.availableCapacity} pessoa{partner.availableCapacity === 1 ? "" : "s"}
            </p>
            {price && (
              <p className="mt-5 text-muted">
                A partir de <span className="text-2xl font-semibold text-ink">{price.value}</span>{" "}
                {price.label && <span>· {price.label}</span>}
              </p>
            )}

            <div className="mt-7 rounded-2xl border border-border bg-surface p-5">
              <p className="text-sm leading-relaxed text-muted">
                Gostou desta opção? Envie sua solicitação e a equipe Hospeda Link negocia a hospedagem
                da sua equipe com o estabelecimento.
              </p>
              <p className="mt-3 text-sm text-muted">Preços referenciais. Valores e disponibilidade serão confirmados para as datas solicitadas. A solicitação não confirma uma reserva.</p>
              <LinkButton to={`/solicitar-hospedagem?parceiro=${encodeURIComponent(partner.id)}`} variant="accent" className="mt-4 w-full">
                Solicitar hospedagem
              </LinkButton>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">Acomodações</h2>
            {partner.roomTypes.length > 0 ? (
              <ul className="divide-y divide-border">
                {partner.roomTypes.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-ink">{r.name}</p>
                      <p className="text-xs text-muted">
                        {r.quantity} unidade{r.quantity > 1 ? "s" : ""} · {r.bedsPerRoom}{" "}
                        {r.bedsPerRoom > 1 ? "camas" : "cama"}
                      </p>
                    </div>
                    {r.price > 0 && (
                      <div className="text-right">
                        <p className="font-medium text-ink">{formatBRL(r.price)}</p>
                        <p className="text-xs text-muted">{priceLabel(r.priceType)}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Consulte a equipe para detalhes das acomodações.</p>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">Comodidades</h2>
            {partner.services.length > 0 ? (
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {partner.services.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-ink">
                    <CheckCircle size={18} weight="fill" className="shrink-0 text-accent" />
                    {SERVICE_LABEL[s] ?? s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Sem comodidades informadas.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
