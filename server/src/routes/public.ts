import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { generateProtocol, isUniqueConstraintError } from "../lib/protocol";
import { partnerCategorySchema } from "../lib/statuses";

const router = Router();

const onlyDigits = (v: string) => v.replace(/\D/g, "");
const validDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      !Number.isNaN(date.getTime()) &&
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Data inválida");

const requestSchema = z.object({
  tradeName: z.string().min(2),
  cnpj: z.string().transform(onlyDigits).refine((v) => v.length === 14, "CNPJ inválido"),
  contactName: z.string().min(2),
  contactRole: z.string().optional().default(""),
  contactEmail: z.string().email(),
  contactPhone: z.string().transform(onlyDigits),
  numberOfGuests: z.coerce.number().int().min(1),
  checkIn: validDate,
  checkOut: validDate,
  workLocation: z.string().optional().default(""),
  accommodationPreference: z.array(z.string()).min(1),
  services: z.array(z.string()).default([]),
  budgetRange: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  consent: z.literal(true, {
    errorMap: () => ({ message: "É necessário autorizar o contato." }),
  }),
});

router.post("/requests", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }
  const data = parsed.data;

  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  if (checkOut <= checkIn) {
    res.status(400).json({ error: "A data de saída deve ser posterior à entrada." });
    return;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const protocol = await generateProtocol();

    try {
      const request = await prisma.accommodationRequest.create({
        data: {
          protocol,
          company: {
            create: {
              legalName: data.tradeName,
              tradeName: data.tradeName,
              cnpj: data.cnpj,
              contactName: data.contactName,
              contactRole: data.contactRole || null,
              contactEmail: data.contactEmail,
              contactPhone: data.contactPhone,
            },
          },
          numberOfGuests: data.numberOfGuests,
          checkIn,
          checkOut,
          workLocation: data.workLocation || null,
          accommodationPreference: data.accommodationPreference,
          budgetRange: data.budgetRange || null,
          notes: data.notes || null,
          requirements: {
            create: data.services.map((type) => ({ type })),
          },
        },
      });

      res.status(201).json({ protocol: request.protocol });
      return;
    } catch (error) {
      if (!isUniqueConstraintError(error) || attempt === 2) throw error;
    }
  }
});

const partnerSchema = z.object({
  tradeName: z.string().min(2),
  legalName: z.string().min(2),
  cnpj: z.string().transform(onlyDigits).refine((v) => v.length === 14, "CNPJ inválido"),
  contactName: z.string().min(2),
  phone: z.string().transform(onlyDigits),
  whatsapp: z.string().transform(onlyDigits).optional().default(""),
  email: z.string().email(),
  address: z.string().min(3),
  category: partnerCategorySchema,
  availableCapacity: z.coerce.number().int().min(1),
  roomTypes: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.coerce.number().int().min(1),
        bedsPerRoom: z.coerce.number().int().min(1),
        priceType: z.string(),
        price: z.coerce.number().min(0),
      }),
    )
    .min(1),
  services: z.array(z.string()).default([]),
  conditions: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  consent: z.literal(true, {
    errorMap: () => ({ message: "É necessário autorizar o contato." }),
  }),
});

router.post("/partners", async (req, res) => {
  const parsed = partnerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }
  const data = parsed.data;

  await prisma.partner.create({
    data: {
      legalName: data.legalName,
      tradeName: data.tradeName,
      cnpj: data.cnpj,
      contactName: data.contactName,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      email: data.email,
      address: data.address,
      category: data.category,
      availableCapacity: data.availableCapacity,
      notes: [data.conditions, data.notes].filter(Boolean).join("\n") || null,
      roomTypes: {
        create: data.roomTypes.map((r) => ({
          name: r.name,
          quantity: r.quantity,
          bedsPerRoom: r.bedsPerRoom,
          priceType: r.priceType,
          price: r.price,
        })),
      },
      services: {
        create: data.services.map((serviceType) => ({ serviceType })),
      },
    },
  });

  res.status(201).json({ ok: true });
});

export default router;
