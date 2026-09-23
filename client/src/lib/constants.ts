import type { NegotiationStatus, PartnerStatus, ProposalStatus, RequestStatus, ContractStatus } from "./types";

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  NOVA: "Nova",
  EM_ANALISE: "Em análise",
  BUSCANDO_HOSPEDAGEM: "Buscando hospedagem",
  PROPOSTA_ENVIADA: "Proposta enviada",
  EM_NEGOCIACAO: "Em negociação",
  APROVADA: "Aprovada",
  CONTRATO_FECHADO: "Contrato fechado",
  CANCELADA: "Cancelada",
};

export const PARTNER_STATUS_LABEL: Record<PartnerStatus, string> = {
  PENDING: "Pendente",
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};

export const NEGOTIATION_STATUS_LABEL: Record<NegotiationStatus, string> = {
  AGUARDANDO_RETORNO: "Aguardando retorno",
  DISPONIVEL: "Disponível",
  INDISPONIVEL: "Indisponível",
  NEGOCIANDO: "Negociando",
  SELECIONADO: "Selecionado",
  RECUSADO: "Recusado",
};

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  ABERTA: "Aberta",
  ENVIADA: "Enviada",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
  CONVERTIDA: "Convertida",
};

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  AGUARDANDO_ASSINATURA: "Aguardando assinatura",
  ATIVO: "Ativo",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export const SERVICES: { value: string; label: string }[] = [
  { value: "BREAKFAST", label: "Café da manhã" },
  { value: "LUNCH", label: "Almoço" },
  { value: "DINNER", label: "Jantar" },
  { value: "LAUNDRY", label: "Lavanderia" },
  { value: "PARKING", label: "Estacionamento" },
  { value: "WIFI", label: "Wi-Fi" },
  { value: "AIR_CONDITIONING", label: "Ar-condicionado" },
  { value: "KITCHEN", label: "Cozinha" },
  { value: "RECEPTION_24H", label: "Recepção 24h" },
];

export const SERVICE_LABEL: Record<string, string> = Object.fromEntries(
  SERVICES.map((s) => [s.value, s.label]),
);

export const ACCOMMODATION_PREFERENCES = [
  "Quarto individual",
  "Quarto duplo",
  "Quarto compartilhado",
  "Alojamento",
  "Sem preferência",
];

export const BUDGET_RANGES = [
  "Até R$ 60",
  "R$ 60 a R$ 80",
  "R$ 80 a R$ 100",
  "R$ 100 a R$ 150",
  "Acima de R$ 150",
  "Ainda não definido",
];

export const PRICE_TYPES = [
  { value: "DIARIA", label: "Diária" },
  { value: "PESSOA", label: "Por pessoa" },
  { value: "QUARTO", label: "Por quarto" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "MENSAL", label: "Mensal" },
];

export const COMMISSION_DEFAULT = 10;
