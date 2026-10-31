import { z } from "zod";
import { partnerCategorySchema, partnerServiceSchema, partnerStatusSchema } from "./statuses";

const onlyDigits = (v: string) => v.replace(/\D/g, "");

export const partnerInputSchema = z.object({
  tradeName: z.string().min(2).max(120),
  legalName: z.string().min(2).max(160),
  cnpj: z.string().transform(onlyDigits).refine((v) => v.length === 14, "CNPJ inválido."),
  contactName: z.string().min(2).max(120),
  phone: z.string().transform(onlyDigits).refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido."),
  whatsapp: z.string().transform(onlyDigits).optional().default(""),
  email: z.string().email().max(200),
  address: z.string().min(3).max(240),
  category: partnerCategorySchema,
  status: partnerStatusSchema.default("ACTIVE"),
  availableCapacity: z.coerce.number().int().min(1),
  roomTypes: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        quantity: z.coerce.number().int().min(1),
        bedsPerRoom: z.coerce.number().int().min(1),
        priceType: z.enum(["DIARIA", "PESSOA", "QUARTO", "SEMANAL", "MENSAL"]),
        price: z.coerce.number().min(0),
      }),
    )
    .min(1),
  services: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional().default(""),
});

export type PartnerInput = z.infer<typeof partnerInputSchema>;

/**
 * Candidatura enviada pelo público em /seja-parceiro.
 * Mesmos campos do cadastro interno, exceto: sem `status` (sempre PENDING no
 * servidor), sem `notes` (observações são internas) e com consentimento
 * obrigatório para o contato.
 */
export const publicPartnerApplicationSchema = z.object({
  tradeName: z.string().min(2).max(120),
  legalName: z.string().min(2).max(160),
  cnpj: z.string().transform(onlyDigits).refine((v) => v.length === 14, "CNPJ inválido."),
  contactName: z.string().min(2).max(120),
  phone: z.string().transform(onlyDigits).refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido."),
  whatsapp: z.string().transform(onlyDigits).optional().default(""),
  email: z.string().email().max(200),
  address: z.string().min(3).max(240),
  category: partnerCategorySchema,
  availableCapacity: z.coerce.number().int().min(1),
  roomTypes: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        quantity: z.coerce.number().int().min(1),
        bedsPerRoom: z.coerce.number().int().min(1),
        priceType: z.enum(["DIARIA", "PESSOA", "QUARTO", "SEMANAL", "MENSAL"]),
        price: z.coerce.number().min(0),
      }),
    )
    .min(1)
    .max(10),
  services: z.array(partnerServiceSchema).max(20).default([]),
  consent: z.literal(true, {
    errorMap: () => ({ message: "É necessário autorizar o contato." }),
  }),
});

export type PublicPartnerApplication = z.infer<typeof publicPartnerApplicationSchema>;

export function partnerData(data: PartnerInput) {
  return {
    legalName: data.legalName,
    tradeName: data.tradeName,
    cnpj: data.cnpj,
    contactName: data.contactName,
    phone: data.phone,
    whatsapp: data.whatsapp || null,
    email: data.email,
    address: data.address,
    category: data.category,
    status: data.status,
    availableCapacity: data.availableCapacity,
    notes: data.notes || null,
  };
}

export const roomTypesCreate = (data: Pick<PartnerInput, "roomTypes">) =>
  data.roomTypes.map((r) => ({
    name: r.name,
    quantity: r.quantity,
    bedsPerRoom: r.bedsPerRoom,
    priceType: r.priceType,
    price: r.price,
  }));

export const servicesCreate = (data: Pick<PartnerInput, "services">) =>
  [...new Set(data.services)].map((serviceType) => ({ serviceType }));
