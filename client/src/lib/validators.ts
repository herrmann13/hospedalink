import { z } from "zod";
import { onlyDigits } from "./masks";

const cnpj = z
  .string()
  .min(1, "Informe o CNPJ")
  .transform(onlyDigits)
  .refine((v) => v.length === 14, "CNPJ inválido");

const phone = z
  .string()
  .min(1, "Informe o telefone")
  .transform(onlyDigits)
  .refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido");

const email = z.string().min(1, "Informe o e-mail").email("E-mail inválido");

export const companySchema = z.object({
  tradeName: z.string().min(2, "Informe o nome da empresa"),
  cnpj,
  contactName: z.string().min(2, "Informe o nome do responsável"),
  contactRole: z.string().optional().or(z.literal("")),
  contactEmail: email,
  contactPhone: phone,
});

export const accommodationSchema = z.object({
  numberOfGuests: z.coerce
    .number({ invalid_type_error: "Informe a quantidade" })
    .int()
    .min(1, "Mínimo de 1 pessoa")
    .max(500, "Valor muito alto"),
  checkIn: z.string().min(1, "Informe a data de entrada"),
  checkOut: z.string().min(1, "Informe a data de saída"),
  workLocation: z.string().optional().or(z.literal("")),
  accommodationPreference: z
    .array(z.string())
    .min(1, "Selecione ao menos uma opção"),
  services: z.array(z.string()),
  budgetRange: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const requestSchema = companySchema
  .merge(accommodationSchema)
  .extend({
    consent: z.boolean().refine((v) => v === true, {
      message: "É necessário autorizar o contato",
    }),
  })
  .refine((v) => !v.checkIn || !v.checkOut || v.checkOut > v.checkIn, {
    message: "A data de saída deve ser posterior à entrada",
    path: ["checkOut"],
  });

export type RequestFormValues = z.infer<typeof requestSchema>;
export type CompanyValues = z.infer<typeof companySchema>;
export type AccommodationValues = z.infer<typeof accommodationSchema>;

export const partnerSchema = z.object({
  tradeName: z.string().min(2, "Informe o nome do estabelecimento"),
  legalName: z.string().min(2, "Informe a razão social"),
  cnpj,
  contactName: z.string().min(2, "Informe o nome do responsável"),
  phone,
  whatsapp: z.string().optional().or(z.literal("")),
  email,
  address: z.string().min(3, "Informe o endereço"),
  category: z.string().min(1, "Selecione a categoria"),
  availableCapacity: z.coerce.number().int().min(1, "Informe a capacidade"),
  roomTypes: z
    .array(
      z.object({
        name: z.string().min(1, "Descrição do quarto"),
        quantity: z.coerce.number().int().min(1),
        bedsPerRoom: z.coerce.number().int().min(1),
        priceType: z.string(),
        price: z.coerce.number().min(0),
      }),
    )
    .min(1, "Adicione ao menos um tipo de quarto"),
  services: z.array(z.string()),
  conditions: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  consent: z.boolean().refine((v) => v === true, {
    message: "É necessário autorizar o contato",
  }),
});

export type PartnerFormValues = z.infer<typeof partnerSchema>;
