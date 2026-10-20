import { z } from "zod";

export const requestStatusSchema = z.enum([
  "NOVA",
  "EM_ANALISE",
  "BUSCANDO_HOSPEDAGEM",
  "PROPOSTA_ENVIADA",
  "EM_NEGOCIACAO",
  "APROVADA",
  "CONTRATO_FECHADO",
  "CANCELADA",
]);

export const partnerStatusSchema = z.enum(["PENDING", "ACTIVE", "INACTIVE"]);

export const partnerCategorySchema = z.enum([
  "HOTEL",
  "POUSADA",
  "ALOJAMENTO",
  "APART_HOTEL",
  "HOSTEL",
  "CASA",
]);

export const negotiationStatusSchema = z.enum([
  "AGUARDANDO_RETORNO",
  "DISPONIVEL",
  "INDISPONIVEL",
  "NEGOCIANDO",
  "SELECIONADO",
  "RECUSADO",
]);

export const contractStatusSchema = z.enum([
  "AGUARDANDO_ASSINATURA",
  "ATIVO",
  "FINALIZADO",
  "CANCELADO",
]);
