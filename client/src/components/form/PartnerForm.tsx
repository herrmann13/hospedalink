import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Plus, SpinnerGap, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/fields";
import { partnerSchema, type PartnerFormValues } from "@/lib/validators";
import { maskCnpj, maskPhone } from "@/lib/masks";
import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABEL,
  PARTNER_STATUS_LABEL,
  PRICE_TYPES,
  SERVICES,
} from "@/lib/constants";
import type { Partner, PartnerStatus } from "@/lib/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const ROOM_OPTIONS = [
  "Quarto individual",
  "Quarto duplo",
  "Quarto triplo",
  "Quarto compartilhado",
  "Alojamento",
  "Suíte",
];

const STATUSES = Object.keys(PARTNER_STATUS_LABEL) as PartnerStatus[];

function toFormValues(partner?: Partner): PartnerFormValues {
  if (!partner) {
    return {
      tradeName: "",
      legalName: "",
      cnpj: "",
      contactName: "",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      category: "",
      status: "ACTIVE",
      availableCapacity: 10,
      roomTypes: [{ name: "Quarto individual", quantity: 1, bedsPerRoom: 1, priceType: "DIARIA", price: 0 }],
      services: [],
      notes: "",
    };
  }
  return {
    tradeName: partner.tradeName,
    legalName: partner.legalName,
    cnpj: maskCnpj(partner.cnpj),
    contactName: partner.contactName,
    phone: maskPhone(partner.phone),
    whatsapp: partner.whatsapp ? maskPhone(partner.whatsapp) : "",
    email: partner.email,
    address: partner.address,
    category: partner.category,
    status: partner.status,
    availableCapacity: partner.availableCapacity,
    roomTypes: (partner.roomTypes ?? []).map((r) => ({
      name: r.name,
      quantity: r.quantity,
      bedsPerRoom: r.bedsPerRoom,
      priceType: r.priceType,
      price: r.price,
    })),
    services: partner.services ?? [],
    notes: partner.notes ?? "",
  };
}

/** Cadastro e edição de parceiros (somente no painel administrativo). */
export function PartnerForm({ partner }: { partner?: Partner }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: toFormValues(partner),
    mode: "onTouched",
  });

  const { fields, append, remove } = useFieldArray({ control, name: "roomTypes" });

  const services = watch("services") ?? [];
  const category = watch("category");

  const toggleService = (value: string) => {
    const next = services.includes(value)
      ? services.filter((v) => v !== value)
      : [...services, value];
    setValue("services", next, { shouldValidate: true });
  };

  const onSubmit = async (values: PartnerFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const { partner: saved } = partner
        ? await api.put<{ partner: Partner }>(`/api/admin/partners/${partner.id}`, values)
        : await api.post<{ partner: Partner }>("/api/admin/partners", values);
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.setQueryData(["partner", saved.id], { partner: saved });
      navigate(`/admin/parceiros/${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <Section title="Dados básicos">
        <Field label="Nome do estabelecimento" required error={errors.tradeName?.message}>
          <Input placeholder="Ex.: Hotel Executivo Jataí" {...register("tradeName")} />
        </Field>
        <Field label="Categoria" required error={errors.category?.message}>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {PARTNER_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setValue("category", c, { shouldValidate: true })}
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                  category === c
                    ? "border-accent bg-accent-soft text-accent-strong"
                    : "border-border bg-white text-ink hover:border-brand-600",
                )}
              >
                {PARTNER_CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Razão social" required error={errors.legalName?.message}>
            <Input {...register("legalName")} />
          </Field>
          <Field label="CNPJ" required error={errors.cnpj?.message}>
            <Controller
              control={control}
              name="cnpj"
              render={({ field }) => (
                <Input
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) => field.onChange(maskCnpj(e.target.value))}
                />
              )}
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome do responsável" required error={errors.contactName?.message}>
            <Input {...register("contactName")} />
          </Field>
          <Field label="Status" required error={errors.status?.message}>
            <Select {...register("status")}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PARTNER_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Telefone" required error={errors.phone?.message}>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <Input
                  placeholder="(64) 0000-0000"
                  inputMode="tel"
                  value={field.value}
                  onChange={(e) => field.onChange(maskPhone(e.target.value))}
                />
              )}
            />
          </Field>
          <Field label="WhatsApp" error={errors.whatsapp?.message}>
            <Controller
              control={control}
              name="whatsapp"
              render={({ field }) => (
                <Input
                  placeholder="(64) 90000-0000"
                  inputMode="tel"
                  value={field.value}
                  onChange={(e) => field.onChange(maskPhone(e.target.value))}
                />
              )}
            />
          </Field>
        </div>
        <Field label="E-mail" required error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </Field>
        <Field label="Endereço" required error={errors.address?.message}>
          <Input placeholder="Rua, número, bairro, Jataí - GO" {...register("address")} />
        </Field>
      </Section>

      <Section title="Estrutura">
        <Field
          label="Vagas disponibilizadas para clientes da parceria"
          required
          hint="Usado no filtro por quantidade de pessoas. Pode ser diferente da capacidade total."
          error={errors.availableCapacity?.message}
        >
          <Input type="number" min={1} {...register("availableCapacity", { valueAsNumber: true })} />
        </Field>

        <div>
          <span className="text-sm font-medium text-ink">Configuração dos quartos</span>
          <div className="mt-3 space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Descrição">
                    <Select {...register(`roomTypes.${index}.name`)}>
                      {ROOM_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Quantidade">
                    <Input type="number" min={1} {...register(`roomTypes.${index}.quantity`, { valueAsNumber: true })} />
                  </Field>
                  <Field label="Camas por quarto">
                    <Input type="number" min={1} {...register(`roomTypes.${index}.bedsPerRoom`, { valueAsNumber: true })} />
                  </Field>
                  <Field label="Tipo de preço">
                    <Select {...register(`roomTypes.${index}.priceType`)}>
                      {PRICE_TYPES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Preço (R$)">
                    <Input type="number" min={0} step="0.01" {...register(`roomTypes.${index}.price`, { valueAsNumber: true })} />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-red-600"
                >
                  <Trash size={14} /> Remover
                </button>
              </div>
            ))}
          </div>
          {errors.roomTypes?.message && (
            <p className="mt-2 text-xs font-medium text-red-600">{errors.roomTypes.message}</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              append({ name: "Quarto duplo", quantity: 1, bedsPerRoom: 2, priceType: "DIARIA", price: 0 })
            }
          >
            <Plus size={16} />
            Adicionar tipo de quarto
          </Button>
        </div>
      </Section>

      <Section title="Comodidades">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <button
              type="button"
              key={s.value}
              onClick={() => toggleService(s.value)}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                services.includes(s.value)
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-border bg-white text-ink hover:border-brand-600",
              )}
            >
              <span>{s.label}</span>
              {services.includes(s.value) && <CheckCircle size={16} weight="fill" />}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Observações internas">
        <Field label="Observações" hint="Condições comerciais, regras, horários. Não aparece no catálogo público.">
          <Textarea {...register("notes")} />
        </Field>
      </Section>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <SpinnerGap size={16} className="animate-spin" /> : null}
          {submitting ? "Salvando..." : partner ? "Salvar alterações" : "Cadastrar parceiro"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-2xl border border-border bg-white p-6">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}
