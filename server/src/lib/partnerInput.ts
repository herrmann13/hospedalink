import { z } from "zod";
import { partnerCategorySchema, partnerStatusSchema } from "./statuses";

const onlyDigits = (v: string) => v.replace(/\D/g, "");

export const partnerInputSchema = z.object({
  tradeName: z.string().min(2),
  legalName: z.string().min(2),
  cnpj: z.string().transform(onlyDigits).refine((v) => v.length === 14, "CNPJ inválido"),
  contactName: z.string().min(2),
  phone: z.string().transform(onlyDigits).refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido"),
  whatsapp: z.string().transform(onlyDigits).optional().default(""),
  email: z.string().email(),
  address: z.string().min(3),
  category: partnerCategorySchema,
  status: partnerStatusSchema.default("ACTIVE"),
  availableCapacity: z.coerce.number().int().min(1),
  roomTypes: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.coerce.number().int().min(1),
        bedsPerRoom: z.coerce.number().int().min(1),
        priceType: z.enum(["DIARIA", "PESSOA", "QUARTO", "SEMANAL", "MENSAL"]),
        price: z.coerce.number().min(0),
      }),
    )
    .min(1),
  services: z.array(z.string()).default([]),
  notes: z.string().optional().default(""),
});

export type PartnerInput = z.infer<typeof partnerInputSchema>;

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

export const roomTypesCreate = (data: PartnerInput) =>
  data.roomTypes.map((r) => ({
    name: r.name,
    quantity: r.quantity,
    bedsPerRoom: r.bedsPerRoom,
    priceType: r.priceType,
    price: r.price,
  }));

export const servicesCreate = (data: PartnerInput) =>
  [...new Set(data.services)].map((serviceType) => ({ serviceType }));
