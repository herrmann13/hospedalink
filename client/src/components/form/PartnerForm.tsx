import { useState } from "react";
import { Link } from "react-router-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Image, Plus, SpinnerGap, Trash, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select, Checkbox } from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";
import { partnerSchema, type PartnerFormValues } from "@/lib/validators";
import { maskCnpj, maskPhone } from "@/lib/masks";
import { PRICE_TYPES, SERVICES } from "@/lib/constants";
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

export function PartnerForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      tradeName: "",
      legalName: "",
      cnpj: "",
      contactName: "",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      availableCapacity: 10,
      roomTypes: [{ name: "Quarto individual", quantity: 1, bedsPerRoom: 1, priceType: "DIARIA", price: 0 }],
      services: [],
      conditions: "",
      notes: "",
      consent: false,
    },
    mode: "onTouched",
  });

  const { fields, append, remove } = useFieldArray({ control, name: "roomTypes" });

  const services = watch("services") ?? [];

  const toggleService = (value: string) => {
    const next = services.includes(value)
      ? services.filter((v) => v !== value)
      : [...services, value];
    setValue("services", next, { shouldValidate: true });
  };

  const addPhoto = (files: FileList | null) => {
    if (!files) return;
    const remaining = 10 - photos.length;
    const valid = Array.from(files).slice(0, remaining);
    valid.forEach((file) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return;
      if (file.size > 5 * 1024 * 1024) return;
      setPhotos((prev) => [...prev, URL.createObjectURL(file)]);
    });
  };

  const onSubmit = async (values: PartnerFormValues) => {
    setSubmitting(true);
    try {
      await api.post("/api/partners", values);
      setDone(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Cadastre seu estabelecimento
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Receba oportunidades de hospedagem corporativa de empresas que trazem
          colaboradores temporários para Jataí.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
        <section className="space-y-5">
          <h2 className="text-lg font-semibold text-ink">Dados básicos</h2>
          <Field label="Nome do estabelecimento" required error={errors.tradeName?.message}>
            <Input placeholder="Ex.: Hotel Executivo Jataí" {...register("tradeName")} />
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
          <Field label="Nome do responsável" required error={errors.contactName?.message}>
            <Input {...register("contactName")} />
          </Field>
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
        </section>

        <section className="space-y-5 border-t border-border pt-8">
          <h2 className="text-lg font-semibold text-ink">Estrutura</h2>
          <Field
            label="Vagas disponibilizadas para clientes da parceria"
            required
            hint="Pode ser diferente da capacidade total do estabelecimento."
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
        </section>

        <section className="space-y-5 border-t border-border pt-8">
          <h2 className="text-lg font-semibold text-ink">Condições comerciais e serviços</h2>
          <Field label="Condições especiais" hint="Ex.: para estadias superiores a 15 dias, valor negociável.">
            <Textarea {...register("conditions")} />
          </Field>
          <div>
            <span className="text-sm font-medium text-ink">Serviços disponíveis</span>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
          </div>
        </section>

        <section className="space-y-5 border-t border-border pt-8">
          <h2 className="text-lg font-semibold text-ink">Fotos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {photos.map((src, i) => (
              <div key={src} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
                <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-ink shadow-sm"
                  aria-label="Remover foto"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {photos.length < 10 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface text-muted transition-colors hover:border-brand-600 hover:text-brand">
                <Image size={22} />
                <span className="text-xs">Adicionar</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => addPhoto(e.target.files)}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-muted">Até 10 imagens. JPEG, PNG ou WEBP, máx. 5 MB cada.</p>
        </section>

        <section className="space-y-5 border-t border-border pt-8">
          <Field label="Observações" hint="Descreva diferenciais, regras, horários e outras informações importantes.">
            <Textarea {...register("notes")} />
          </Field>
          <Checkbox
            checked={watch("consent")}
            onChange={(v) => setValue("consent", v, { shouldValidate: true })}
            error={errors.consent?.message}
            label={
              <>
                Autorizo o contato para atendimento deste cadastro e concordo com
                o tratamento dos dados conforme a{" "}
                <Link to="/privacidade" className="font-medium text-brand underline">
                  Política de Privacidade
                </Link>
                .
              </>
            }
          />
        </section>

        <div className="flex items-center justify-end border-t border-border pt-6">
          <Button type="submit" disabled={submitting}>
            {submitting ? <SpinnerGap size={16} className="animate-spin" /> : null}
            {submitting ? "Enviando..." : "Enviar cadastro"}
          </Button>
        </div>
      </form>

      <Modal open={done}>
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <CheckCircle size={32} weight="fill" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold text-ink">Cadastro recebido!</h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Recebemos as informações do seu estabelecimento. Nossa equipe vai
            analisar o cadastro e entrar em contato para concluir a parceria.
          </p>
          <div className="mt-7 flex justify-center">
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
            >
              Voltar para página inicial
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
