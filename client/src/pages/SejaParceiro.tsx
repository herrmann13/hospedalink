import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Image as ImageIcon,
  Plus,
  SpinnerGap,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select } from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";
import { partnerApplicationSchema, type PartnerApplicationValues } from "@/lib/validators";
import { maskCnpj, maskPhone } from "@/lib/masks";
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, PRICE_TYPES, ROOM_OPTIONS, SERVICES } from "@/lib/constants";
import type { PartnerApplicationResponse } from "@/lib/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const STEPS = ["Estabelecimento", "Acomodações", "Comodidades", "Contato e fotos"];

const stepFields: (keyof PartnerApplicationValues)[][] = [
  ["tradeName", "legalName", "cnpj", "category", "address", "availableCapacity"],
  ["roomTypes"],
  [],
  ["contactName", "phone", "whatsapp", "email", "consent"],
];

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PHOTOS = ["image/jpeg", "image/png", "image/webp"];

interface SubmitResult {
  uploaded: number;
  failed: number;
}

export function SejaParceiro() {
  const reduceMotion = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState("");
  // Honeypot: campo invisível. Humanos não preenchem; bots costumam preencher.
  const [website, setWebsite] = useState("");

  useEffect(() => {
    document.title = "Cadastre seu estabelecimento — Hospeda Link";
  }, []);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PartnerApplicationValues>({
    resolver: zodResolver(partnerApplicationSchema),
    defaultValues: {
      tradeName: "",
      legalName: "",
      cnpj: "",
      contactName: "",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      category: "",
      availableCapacity: 10,
      roomTypes: [{ name: "Quarto individual", quantity: 1, bedsPerRoom: 1, priceType: "DIARIA", price: 0 }],
      services: [],
      consent: false,
    },
    mode: "onTouched",
  });

  const { fields, append, remove } = useFieldArray({ control, name: "roomTypes" });
  const category = watch("category");
  const services = watch("services") ?? [];

  const toggleService = (value: string) => {
    const next = services.includes(value) ? services.filter((v) => v !== value) : [...services, value];
    setValue("services", next, { shouldValidate: true, shouldDirty: true });
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setPhotoError("");
    const next = [...photos];
    for (const file of Array.from(files)) {
      if (!ACCEPTED_PHOTOS.includes(file.type)) {
        setPhotoError("Envie imagens JPEG, PNG ou WEBP.");
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setPhotoError("Cada foto deve ter no máximo 5 MB.");
        continue;
      }
      if (next.length >= MAX_PHOTOS) {
        setPhotoError(`Máximo de ${MAX_PHOTOS} fotos.`);
        break;
      }
      next.push(file);
    }
    setPhotos(next);
  };

  const next = async () => {
    const ok = await trigger(stepFields[step], { shouldFocus: true });
    if (ok) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      heading.current?.focus();
    }
  };

  const back = () => {
    setStep((s) => Math.max(s - 1, 0));
    heading.current?.focus();
  };

  const onSubmit = async (values: PartnerApplicationValues) => {
    if (submitting || result) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const application = await api.post<PartnerApplicationResponse>("/api/partner-applications", {
        ...values,
        website,
      });

      let uploaded = 0;
      let failed = 0;

      if (application.applicationId && application.token && photos.length > 0) {
        for (const photo of photos) {
          try {
            await api.upload(`/api/partner-applications/${application.applicationId}/images`, photo, {
              "X-Application-Token": application.token,
            });
            uploaded += 1;
          } catch {
            failed += 1;
          }
        }
      }

      setResult({ uploaded, failed });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Não foi possível enviar o cadastro. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const errorFor = (name: keyof PartnerApplicationValues) => errors[name]?.message as string | undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mb-10">
        <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Cadastre seu estabelecimento como parceiro
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Hotéis, pousadas, alojamentos e casas de Jataí podem se cadastrar para receber
          demandas de hospedagem corporativa. Nossa equipe analisa as informações antes
          de publicar o estabelecimento no catálogo — o contato com as empresas é feito
          pela Hospeda Link.
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-ink">
            Etapa {step + 1} de {STEPS.length}
          </span>
          <span className="text-muted" aria-live="polite">
            {STEPS[step]}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-accent" : "bg-surface-2")}
            />
          ))}
        </div>
      </div>

      <form
        onSubmit={(event) => {
          if (step < STEPS.length - 1) {
            event.preventDefault();
            void next();
          } else {
            void handleSubmit(onSubmit, (invalid) => {
              const invalidStep = stepFields.findIndex((fields) => fields.some((field) => invalid[field]));
              if (invalidStep >= 0) setStep(invalidStep);
              heading.current?.focus();
            })(event);
          }
        }}
        noValidate
      >
        {/* Honeypot: fora da tela e fora da ordem de tabulação. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Site</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && (
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Nome do estabelecimento" required error={errorFor("tradeName")}>
                    <Input placeholder="Ex.: Hotel Executivo Jataí" {...register("tradeName")} />
                  </Field>
                  <Field label="Razão social" required error={errorFor("legalName")}>
                    <Input placeholder="Razão social da empresa" {...register("legalName")} />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="CNPJ" required error={errorFor("cnpj")}>
                    <Controller
                      control={control}
                      name="cnpj"
                      render={({ field }) => (
                        <Input
                          placeholder="00.000.000/0000-00"
                          inputMode="numeric"
                          value={field.value}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          onChange={(e) => field.onChange(maskCnpj(e.target.value))}
                        />
                      )}
                    />
                  </Field>
                  <Field
                    label="Vagas para clientes da parceria"
                    required
                    hint="Quantas pessoas você consegue hospedar em uma mesma demanda."
                    error={errorFor("availableCapacity")}
                  >
                    <Input type="number" min={1} {...register("availableCapacity", { valueAsNumber: true })} />
                  </Field>
                </div>

                <Field label="Categoria" required error={errorFor("category")}>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {PARTNER_CATEGORIES.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setValue("category", c, { shouldValidate: true })}
                        aria-pressed={category === c}
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

                <Field
                  label="Endereço"
                  required
                  hint="Rua, número, bairro. O endereço aparece no catálogo; os contatos não."
                  error={errorFor("address")}
                >
                  <Input placeholder="Rua, número, bairro, Jataí - GO" {...register("address")} />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <p className="text-sm leading-relaxed text-muted">
                  Descreva os tipos de acomodação que você oferece e os valores praticados.
                  Os preços são referenciais e podem ser ajustados na negociação.
                </p>
                <div className="space-y-3">
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
                          <Input
                            type="number"
                            min={1}
                            {...register(`roomTypes.${index}.quantity`, { valueAsNumber: true })}
                          />
                        </Field>
                        <Field label="Camas por quarto">
                          <Input
                            type="number"
                            min={1}
                            {...register(`roomTypes.${index}.bedsPerRoom`, { valueAsNumber: true })}
                          />
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
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...register(`roomTypes.${index}.price`, { valueAsNumber: true })}
                          />
                        </Field>
                      </div>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-red-600"
                        >
                          <Trash size={14} /> Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {errorFor("roomTypes") && (
                  <p role="alert" className="text-xs font-medium text-red-600">
                    {errorFor("roomTypes")}
                  </p>
                )}
                {fields.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({ name: "Quarto duplo", quantity: 1, bedsPerRoom: 2, priceType: "DIARIA", price: 0 })
                    }
                  >
                    <Plus size={16} />
                    Adicionar tipo de quarto
                  </Button>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="text-sm leading-relaxed text-muted">
                  Selecione o que o estabelecimento oferece. Isso ajuda as empresas a
                  encontrarem a opção certa.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {SERVICES.map((s) => (
                    <button
                      type="button"
                      key={s.value}
                      onClick={() => toggleService(s.value)}
                      aria-pressed={services.includes(s.value)}
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
            )}

            {step === 3 && (
              <div className="space-y-5">
                <Field label="Nome do responsável" required error={errorFor("contactName")}>
                  <Input placeholder="Quem cuida das reservas" {...register("contactName")} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Telefone" required error={errorFor("phone")}>
                    <Controller
                      control={control}
                      name="phone"
                      render={({ field }) => (
                        <Input
                          placeholder="(64) 0000-0000"
                          inputMode="tel"
                          value={field.value}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          onChange={(e) => field.onChange(maskPhone(e.target.value))}
                        />
                      )}
                    />
                  </Field>
                  <Field label="WhatsApp" error={errorFor("whatsapp")}>
                    <Controller
                      control={control}
                      name="whatsapp"
                      render={({ field }) => (
                        <Input
                          placeholder="(64) 90000-0000"
                          inputMode="tel"
                          value={field.value}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          onChange={(e) => field.onChange(maskPhone(e.target.value))}
                        />
                      )}
                    />
                  </Field>
                </div>
                <Field label="E-mail" required error={errorFor("email")}>
                  <Input type="email" placeholder="contato@estabelecimento.com.br" {...register("email")} />
                </Field>

                <div>
                  <span className="text-sm font-medium text-ink">Fotos (opcional)</span>
                  <p className="mt-1 text-xs text-muted">
                    Até {MAX_PHOTOS} imagens em JPEG, PNG ou WEBP, com no máximo 5 MB cada.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Button type="button" variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
                      <ImageIcon size={16} />
                      Adicionar fotos
                    </Button>
                    <span className="text-xs text-muted">
                      {photos.length} de {MAX_PHOTOS} selecionadas
                    </span>
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      addPhotos(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  {photoError && (
                    <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                      {photoError}
                    </p>
                  )}
                  {photos.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {photos.map((photo, index) => (
                        <li
                          key={`${photo.name}-${index}`}
                          className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs"
                        >
                          <span className="truncate text-ink">{photo.name}</span>
                          <button
                            type="button"
                            onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                            className="ml-3 inline-flex items-center gap-1 text-muted hover:text-red-600"
                          >
                            <Trash size={14} /> Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Checkbox
                  checked={watch("consent")}
                  onChange={(v) => setValue("consent", v, { shouldValidate: true })}
                  error={errorFor("consent")}
                  label={
                    <>
                      Autorizo o contato da Hospeda Link sobre este cadastro e concordo com o
                      tratamento dos dados conforme a{" "}
                      <Link
                        to="/privacidade"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-brand underline"
                      >
                        Política de Privacidade (nova aba)
                      </Link>{" "}
                      e os{" "}
                      <Link to="/termos" target="_blank" rel="noreferrer" className="font-medium text-brand underline">
                        Termos de Uso (nova aba)
                      </Link>
                      .
                    </>
                  }
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {submitError && (
          <p role="alert" className="mt-6 text-red-600">
            {submitError} Seus dados continuam preenchidos; tente enviar novamente.
          </p>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={back} disabled={step === 0} className={cn(step === 0 && "invisible")}>
            <ArrowLeft size={16} />
            Voltar
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Continuar
              <ArrowRight size={16} />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? <SpinnerGap size={16} className="animate-spin" /> : null}
              {submitting ? "Enviando..." : "Enviar cadastro"}
            </Button>
          )}
        </div>
      </form>

      <Modal open={Boolean(result)}>
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <CheckCircle size={32} weight="fill" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold text-ink">Cadastro recebido</h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Nossa equipe vai analisar as informações e entrar em contato pelo telefone ou
            e-mail informado. O estabelecimento só aparece no catálogo depois da aprovação.
          </p>
          {result && result.failed > 0 && (
            <p className="mt-3 text-sm text-muted">
              {result.failed === 1 ? "Uma foto não pôde ser enviada" : `${result.failed} fotos não puderam ser enviadas`}.
              O cadastro está salvo e a equipe pode solicitar as imagens depois.
            </p>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
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
