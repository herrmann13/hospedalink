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
  tradeName: z.string().min(2, "Informe o nome do estabelecimento").max(120, "Máximo de 120 caracteres"),
  legalName: z.string().min(2, "Informe a razão social").max(160, "Máximo de 160 caracteres"),
  cnpj,
  contactName: z.string().min(2, "Informe o nome do responsável").max(120, "Máximo de 120 caracteres"),
  phone,
  whatsapp: z.string().optional().or(z.literal("")),
  email,
  address: z.string().min(3, "Informe o endereço").max(240, "Máximo de 240 caracteres"),
  category: z.string().min(1, "Selecione a categoria"),
  status: z.enum(["PENDING", "ACTIVE", "INACTIVE"]),
  availableCapacity: z.coerce.number().int().min(1, "Informe a capacidade"),
  roomTypes: z
    .array(
      z.object({
        name: z.string().min(1, "Descrição do quarto").max(80, "Máximo de 80 caracteres"),
        quantity: z.coerce.number().int().min(1),
        bedsPerRoom: z.coerce.number().int().min(1),
        priceType: z.string(),
        price: z.coerce.number().min(0),
      }),
    )
    .min(1, "Adicione ao menos um tipo de quarto"),
  services: z.array(z.string()),
  notes: z.string().optional().or(z.literal("")),
});

export type PartnerFormValues = z.infer<typeof partnerSchema>;

/** Candidatura pública em /seja-parceiro (sem status e sem observações internas). */
export const partnerApplicationSchema = z.object({
  tradeName: z.string().min(2, "Informe o nome do estabelecimento").max(120, "Máximo de 120 caracteres"),
  legalName: z.string().min(2, "Informe a razão social").max(160, "Máximo de 160 caracteres"),
  cnpj,
  contactName: z.string().min(2, "Informe o nome do responsável").max(120, "Máximo de 120 caracteres"),
  phone,
  whatsapp: z.string().optional().or(z.literal("")),
  email,
  address: z.string().min(3, "Informe o endereço").max(240, "Máximo de 240 caracteres"),
  category: z.string().min(1, "Selecione a categoria"),
  availableCapacity: z.coerce
    .number({ invalid_type_error: "Informe a capacidade" })
    .int()
    .min(1, "Informe a capacidade"),
  roomTypes: z
    .array(
      z.object({
        name: z.string().min(1, "Descrição do quarto").max(80, "Máximo de 80 caracteres"),
        quantity: z.coerce.number().int().min(1),
        bedsPerRoom: z.coerce.number().int().min(1),
        priceType: z.string(),
        price: z.coerce.number().min(0),
      }),
    )
    .min(1, "Adicione ao menos um tipo de quarto")
    .max(10, "Máximo de 10 tipos de quarto"),
  services: z.array(z.string()),
  consent: z.boolean().refine((v) => v === true, {
    message: "É necessário autorizar o contato",
  }),
});

export type PartnerApplicationValues = z.infer<typeof partnerApplicationSchema>;
