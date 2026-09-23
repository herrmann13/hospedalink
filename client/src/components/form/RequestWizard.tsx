import { useState } from "react";
import { Link } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle, SpinnerGap, WhatsappLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select, Checkbox } from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";
import { requestSchema, type RequestFormValues } from "@/lib/validators";
import { maskCnpj, maskPhone, daysBetween } from "@/lib/masks";
import { ACCOMMODATION_PREFERENCES, BUDGET_RANGES, SERVICES } from "@/lib/constants";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const STEPS = ["Sua empresa", "Sua equipe", "Hospedagem", "Contato e confirmação"];

const stepFields: (keyof RequestFormValues)[][] = [
  ["tradeName", "cnpj", "contactName", "contactRole"],
  ["numberOfGuests", "checkIn", "checkOut", "workLocation"],
  ["accommodationPreference", "services", "budgetRange"],
  ["contactEmail", "contactPhone", "notes", "consent"],
];

export function RequestWizard() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      tradeName: "",
      cnpj: "",
      contactName: "",
      contactRole: "",
      contactEmail: "",
      contactPhone: "",
      numberOfGuests: 5,
      checkIn: "",
      checkOut: "",
      workLocation: "",
      accommodationPreference: [],
      services: [],
      budgetRange: "",
      notes: "",
      consent: false,
    },
    mode: "onTouched",
  });

  const checkIn = watch("checkIn");
  const checkOut = watch("checkOut");
  const nights = daysBetween(checkIn, checkOut);
  const preferences = watch("accommodationPreference") ?? [];
  const services = watch("services") ?? [];

  const toggleArray = (field: "accommodationPreference" | "services", value: string) => {
    const current = (watch(field) ?? []) as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(field, next, { shouldValidate: true, shouldDirty: true });
  };

  const next = async () => {
    const ok = await trigger(stepFields[step]);
    if (ok) setStep((s) => Math.min(s + 1, 3));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (values: RequestFormValues) => {
    setSubmitting(true);
    try {
      const res = await api.post<{ protocol: string }>("/api/requests", values);
      setProtocol(res.protocol);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const errorFor = (name: keyof RequestFormValues) => errors[name]?.message as string | undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Solicite uma cotação de hospedagem para sua equipe
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Preencha as informações abaixo. Nossa equipe analisará sua necessidade
          e entrará em contato com as opções disponíveis.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-ink">
            Etapa {step + 1} de {STEPS.length}
          </span>
          <span className="text-muted">{STEPS[step]}</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-accent" : "bg-surface-2",
              )}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && (
              <div className="space-y-5">
                <Field label="Nome da empresa" required error={errorFor("tradeName")}>
                  <Input placeholder="Ex.: Construtora Horizonte Ltda." {...register("tradeName")} />
                </Field>
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
                          onChange={(e) => field.onChange(maskCnpj(e.target.value))}
                        />
                      )}
                    />
                  </Field>
                  <Field label="Cargo do responsável" error={errorFor("contactRole")}>
                    <Input placeholder="Ex.: Gerente de operações" {...register("contactRole")} />
                  </Field>
                </div>
                <Field label="Nome do responsável" required error={errorFor("contactName")}>
                  <Input placeholder="Nome de quem cuida da contratação" {...register("contactName")} />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <Field
                  label="Quantidade de pessoas"
                  required
                  hint="Grupos de 5 a 20 pessoas são os mais comuns."
                  error={errorFor("numberOfGuests")}
                >
                  <Input type="number" min={1} {...register("numberOfGuests", { valueAsNumber: true })} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Data prevista de entrada" required error={errorFor("checkIn")}>
                    <Input type="date" {...register("checkIn")} />
                  </Field>
                  <Field label="Data prevista de saída" required error={errorFor("checkOut")}>
                    <Input type="date" {...register("checkOut")} />
                  </Field>
                </div>
                {nights > 0 && (
                  <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent-strong">
                    Período estimado: {nights} {nights === 1 ? "dia" : "dias"}.
                  </p>
                )}
                <Field
                  label="Onde a equipe irá trabalhar?"
                  hint="Endereço, obra, fazenda, indústria ou empreendimento. Isso nos ajuda a buscar opções próximas."
                  error={errorFor("workLocation")}
                >
                  <Input placeholder="Ex.: distrito industrial, obra na BR-364" {...register("workLocation")} />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-7">
                <div>
                  <span className="text-sm font-medium text-ink">
                    Preferência de acomodação <span className="text-accent">*</span>
                  </span>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {ACCOMMODATION_PREFERENCES.map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => toggleArray("accommodationPreference", opt)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          preferences.includes(opt)
                            ? "border-accent bg-accent text-white"
                            : "border-border bg-white text-ink hover:border-brand-600",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {errorFor("accommodationPreference") && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {errorFor("accommodationPreference")}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-sm font-medium text-ink">Serviços necessários</span>
                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {SERVICES.map((s) => (
                      <button
                        type="button"
                        key={s.value}
                        onClick={() => toggleArray("services", s.value)}
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

                <Field
                  label="Faixa de orçamento por pessoa / diária"
                  hint="Opcional, caso ainda não conheça os valores praticados."
                >
                  <Select {...register("budgetRange")}>
                    <option value="">Selecione uma faixa</option>
                    {BUDGET_RANGES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="E-mail" required error={errorFor("contactEmail")}>
                    <Input type="email" placeholder="voce@empresa.com.br" {...register("contactEmail")} />
                  </Field>
                  <Field label="Telefone / WhatsApp" required error={errorFor("contactPhone")}>
                    <Controller
                      control={control}
                      name="contactPhone"
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
                <Field label="Conte mais sobre sua necessidade">
                  <Textarea
                    placeholder="Ex.: precisamos hospedar uma equipe de manutenção durante 20 dias. A equipe trabalha próxima ao distrito industrial e precisa sair às 06:00."
                    {...register("notes")}
                  />
                </Field>
                <Checkbox
                  checked={watch("consent")}
                  onChange={(v) => setValue("consent", v, { shouldValidate: true })}
                  error={errorFor("consent")}
                  label={
                    <>
                      Autorizo o contato da empresa para atendimento desta
                      solicitação e concordo com o tratamento dos dados conforme a{" "}
                      <Link to="/privacidade" className="font-medium text-brand underline">
                        Política de Privacidade
                      </Link>{" "}
                      e os{" "}
                      <Link to="/termos" className="font-medium text-brand underline">
                        Termos de Uso
                      </Link>
                      .
                    </>
                  }
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={back} disabled={step === 0} className={cn(step === 0 && "invisible")}>
            <ArrowLeft size={16} />
            Voltar
          </Button>
          {step < 3 ? (
            <Button type="button" onClick={next}>
              Continuar
              <ArrowRight size={16} />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? <SpinnerGap size={16} className="animate-spin" /> : null}
              {submitting ? "Enviando..." : "Solicitar cotação"}
            </Button>
          )}
        </div>
      </form>

      <Modal open={!!protocol}>
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <CheckCircle size={32} weight="fill" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold text-ink">Solicitação recebida!</h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Recebemos as informações da sua equipe. Agora vamos analisar sua
            necessidade, consultar nossos parceiros e entraremos em contato para
            apresentar as opções disponíveis.
          </p>
          {protocol && (
            <p className="mt-5 font-mono text-sm text-muted">
              Protocolo <span className="font-semibold text-ink">{protocol}</span>
            </p>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
            >
              Voltar para página inicial
            </Link>
            <a
              href="https://wa.me/5500000000000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
            >
                <WhatsappLogo size={18} weight="fill" />
              Falar pelo WhatsApp
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}
