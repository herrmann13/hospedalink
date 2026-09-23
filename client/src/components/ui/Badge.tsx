import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "accent" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-soft text-accent-strong",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-700",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function requestTone(status: string): Tone {
  switch (status) {
    case "NOVA":
      return "info";
    case "EM_ANALISE":
    case "BUSCANDO_HOSPEDAGEM":
      return "brand";
    case "PROPOSTA_ENVIADA":
    case "EM_NEGOCIACAO":
    case "APROVADA":
      return "warning";
    case "CONTRATO_FECHADO":
      return "accent";
    case "CANCELADA":
      return "danger";
    default:
      return "neutral";
  }
}

export function partnerTone(status: string): Tone {
  switch (status) {
    case "ACTIVE":
      return "accent";
    case "PENDING":
      return "warning";
    case "INACTIVE":
      return "neutral";
    default:
      return "neutral";
  }
}

export function negotiationTone(status: string): Tone {
  switch (status) {
    case "SELECIONADO":
    case "DISPONIVEL":
      return "accent";
    case "NEGOCIANDO":
      return "warning";
    case "INDISPONIVEL":
    case "RECUSADO":
      return "danger";
    case "AGUARDANDO_RETORNO":
    default:
      return "brand";
  }
}

export function contractTone(status: string): Tone {
  switch (status) {
    case "ATIVO":
      return "accent";
    case "AGUARDANDO_ASSINATURA":
      return "warning";
    case "FINALIZADO":
      return "info";
    case "CANCELADO":
      return "danger";
    default:
      return "neutral";
  }
}
