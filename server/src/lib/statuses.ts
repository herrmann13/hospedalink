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

/**
 * Comodidades aceitas. Deve espelhar `SERVICES` em client/src/lib/constants.ts.
 * O cadastro público valida contra esta lista para não gravar texto arbitrário.
 */
export const PARTNER_SERVICE_TYPES = [
  "BREAKFAST",
  "EARLY_BREAKFAST",
  "LUNCH",
  "DINNER",
  "PACKED_MEAL",
  "KITCHEN",
  "AIR_CONDITIONING",
  "PRIVATE_BATHROOM",
  "TV",
  "MINIBAR",
  "WIFI",
  "BED_LINEN",
  "DAILY_CLEANING",
  "LAUNDRY",
  "PARKING",
  "LARGE_VEHICLE_PARKING",
  "RECEPTION_24H",
  "MEETING_ROOM",
  "ACCESSIBILITY",
  "INVOICE",
] as const;

export const partnerServiceSchema = z.enum(PARTNER_SERVICE_TYPES);

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
