import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Image, PencilSimple, SpinnerGap, X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatBRL } from "@/lib/masks";
import type { Partner, PartnerCategory } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, partnerTone } from "@/components/ui/Badge";
import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABEL,
  PARTNER_STATUS_LABEL,
  SERVICE_LABEL,
  PRICE_TYPES,
} from "@/lib/constants";
import { Button, LinkButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/fields";
import { cn } from "@/lib/cn";

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

  const setCategory = useMutation({
    mutationFn: (category: PartnerCategory) => api.patch(`/api/admin/partners/${id}`, { category }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner", id] });
      qc.invalidateQueries({ queryKey: ["partners"] });
    },
  });

  const partner = data?.partner;
  const { hash } = useLocation();

  // Menu "Fotos" da listagem abre esta página em #fotos.
  useEffect(() => {
    if (partner && hash) document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [partner, hash]);

  const onPartnerSaved = (saved: Partner) => {
    qc.setQueryData(["partner", id], { partner: saved });
    qc.invalidateQueries({ queryKey: ["partners"] });
  };

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
          <div className="flex flex-wrap items-center gap-2">
            {partner.status === "PENDING" ? (
              <>
                <Button variant="accent" onClick={() => setStatus.mutate("ACTIVE")}>
                  Aprovar parceiro
                </Button>
                <Button variant="secondary" onClick={() => setStatus.mutate("INACTIVE")}>
                  Recusar
                </Button>
              </>
            ) : (
              <Badge tone={partnerTone(partner.status)}>{PARTNER_STATUS_LABEL[partner.status]}</Badge>
            )}
            <LinkButton to={`/admin/parceiros/${partner.id}/editar`} variant="outline">
              <PencilSimple size={16} />
              Editar
            </LinkButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Dados">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Categoria</dt>
                <dd className="mt-1">
                  <Select
                    value={partner.category}
                    onChange={(e) => setCategory.mutate(e.target.value as PartnerCategory)}
                    disabled={setCategory.isPending}
                    className="h-9 text-sm"
                  >
                    {PARTNER_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {PARTNER_CATEGORY_LABEL[c]}
                      </option>
                    ))}
                  </Select>
                </dd>
              </div>
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

          <Section title="Fotos" id="fotos">
            <PartnerPhotos partner={partner} onSaved={onPartnerSaved} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 rounded-2xl border border-border bg-white p-6">
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

const MAX_PHOTOS = 10;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function PartnerPhotos({ partner, onSaved }: { partner: Partner; onSaved: (p: Partner) => void }) {
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const images = partner.images ?? [];

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const queue = Array.from(files).slice(0, MAX_PHOTOS - images.length);
    const invalid = queue.find((f) => !ACCEPTED_TYPES.includes(f.type) || f.size > MAX_PHOTO_BYTES);
    if (invalid) {
      setError(`"${invalid.name}" precisa ser JPEG, PNG ou WEBP com até 5 MB.`);
      return;
    }
    setUploading(queue.length);
    try {
      for (const file of queue) {
        const { partner: saved } = await api.upload<{ partner: Partner }>(
          `/api/admin/partners/${partner.id}/images`,
          file,
        );
        onSaved(saved);
        setUploading((n) => n - 1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar a foto.");
    } finally {
      setUploading(0);
    }
  };

  const remove = async (imageId: string) => {
    setError(null);
    try {
      const { partner: saved } = await api.delete<{ partner: Partner }>(
        `/api/admin/partners/${partner.id}/images/${imageId}`,
      );
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao remover a foto.");
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, i) => (
          <div key={img.id} className="relative">
            <img
              src={img.imageUrl}
              alt={`Foto ${i + 1}`}
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => remove(img.id)}
              className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-ink shadow-sm hover:text-red-600"
              aria-label={`Remover foto ${i + 1}`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {images.length < MAX_PHOTOS && (
          <label
            className={cn(
              "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-surface text-muted transition-colors hover:border-brand-600 hover:text-brand",
              uploading > 0 && "pointer-events-none opacity-60",
            )}
          >
            {uploading > 0 ? <SpinnerGap size={22} className="animate-spin" /> : <Image size={22} />}
            <span className="text-xs">{uploading > 0 ? `Enviando (${uploading})...` : "Adicionar"}</span>
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              multiple
              className="hidden"
              onChange={(e) => {
                upload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">Até {MAX_PHOTOS} fotos. JPEG, PNG ou WEBP, máx. 5 MB cada.</p>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
