import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatBRL } from "@/lib/masks";
import type { Partner } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, partnerTone } from "@/components/ui/Badge";
import { PARTNER_STATUS_LABEL, SERVICE_LABEL, PRICE_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

export function ParceiroDetalhe() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["partner", id],
    queryFn: () => api.get<{ partner: Partner }>(`/api/admin/partners/${id}`),
  });

  const setStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/api/admin/partners/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner", id] });
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const partner = data?.partner;

  if (isLoading || !partner) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  const priceLabel = (t: string) => PRICE_TYPES.find((p) => p.value === t)?.label ?? t;

  return (
    <div>
      <PageHeader
        backTo="/admin/parceiros"
        title={partner.tradeName}
        description={partner.legalName}
        action={
          partner.status === "PENDING" ? (
            <div className="flex gap-2">
              <Button variant="accent" onClick={() => setStatus.mutate("ACTIVE")}>
                Aprovar parceiro
              </Button>
              <Button variant="secondary" onClick={() => setStatus.mutate("INACTIVE")}>
                Recusar
              </Button>
            </div>
          ) : (
            <Badge tone={partnerTone(partner.status)}>{PARTNER_STATUS_LABEL[partner.status]}</Badge>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Dados">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="CNPJ" value={partner.cnpj} mono />
              <Detail label="Responsável" value={partner.contactName} />
              <Detail label="Telefone" value={partner.phone} />
              <Detail label="WhatsApp" value={partner.whatsapp || "-"} />
              <Detail label="E-mail" value={partner.email} />
              <Detail label="Endereço" value={partner.address} />
              <Detail label="Vagas para parceria" value={String(partner.availableCapacity)} />
            </dl>
          </Section>

          <Section title="Configuração dos quartos">
            {partner.roomTypes && partner.roomTypes.length > 0 ? (
              <ul className="divide-y divide-border">
                {partner.roomTypes.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium text-ink">{r.name}</p>
                      <p className="text-xs text-muted">
                        {r.quantity} unidade{r.quantity > 1 ? "s" : ""} · {r.bedsPerRoom}{" "}
                        {r.bedsPerRoom > 1 ? "camas" : "cama"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-ink">{formatBRL(r.price)}</p>
                      <p className="text-xs text-muted">{priceLabel(r.priceType)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Sem tipos de quarto cadastrados.</p>
            )}
          </Section>

          <Section title="Serviços">
            {partner.services && partner.services.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {partner.services.map((s) => (
                  <span key={s} className="rounded-full bg-surface-2 px-3 py-1 text-sm text-muted">
                    {SERVICE_LABEL[s] ?? s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Sem serviços informados.</p>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Observações">
            <p className="text-sm leading-relaxed text-muted">{partner.notes || "Sem observações."}</p>
          </Section>

          {partner.images && partner.images.length > 0 && (
            <Section title="Fotos">
              <div className="grid grid-cols-2 gap-2">
                {partner.images.map((img, i) => (
                  <img
                    key={img.id}
                    src={img.imageUrl}
                    alt={`Foto ${i + 1}`}
                    className="aspect-[4/3] w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-1 text-sm text-ink ${mono ? "font-mono" : ""}`}>{value || "-"}</dd>
    </div>
  );
}
