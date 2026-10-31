import express, { Router } from "express";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { generateProtocol, isUniqueConstraintError } from "../lib/protocol";
import { serializePublicPartner } from "../lib/serialize";
import {
  detectImageType,
  IMAGE_EXTENSION,
  isExternalUrl,
  MAX_IMAGE_BYTES,
  putObject,
  signedUrl,
  signedUrlMaxAge,
  storageEnabled,
} from "../lib/storage";
import { COOKIE_NAME, verifyToken } from "../lib/jwt";
import { partnerData, publicPartnerApplicationSchema, roomTypesCreate, servicesCreate } from "../lib/partnerInput";
import { consumeQuota, rateLimit } from "../lib/rateLimit";

const router = Router();

const onlyDigits = (v: string) => v.replace(/\D/g, "");
const validDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      !Number.isNaN(date.getTime()) &&
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Data inválida.");

const requestSchema = z.object({
  tradeName: z.string().min(2),
  cnpj: z.string().transform(onlyDigits).refine((v) => v.length === 14, "CNPJ inválido."),
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

const MAX_PUBLIC_IMAGES = 5;
const APPLICATION_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

// Limites configuráveis por ambiente (padrão: 3 cadastros por hora por IP).
const positiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const APPLICATION_RATE_MAX = positiveInt(process.env.PARTNER_APPLICATION_RATE_MAX, 3);
const APPLICATION_RATE_WINDOW_MS = positiveInt(
  process.env.PARTNER_APPLICATION_RATE_WINDOW_MS,
  60 * 60 * 1000,
);

const applicationLimiter = rateLimit({
  name: "partner-application",
  max: APPLICATION_RATE_MAX,
  windowMs: APPLICATION_RATE_WINDOW_MS,
});
const applicationImageLimiter = rateLimit({
  name: "partner-application-image",
  max: 15,
  windowMs: 60 * 60 * 1000,
});

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** CNPJs com criação em andamento neste processo (proteção contra duplo envio). */
const applicationsInFlight = new Set<string>();

async function hasAdminSession(req: express.Request) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return false;
  return Boolean(await verifyToken(token));
}

/**
 * Candidatura pública de parceiro (/seja-parceiro).
 * Nasce sempre PENDING + source PUBLIC: só entra no catálogo depois da aprovação
 * da equipe. Devolve um token temporário para o envio das fotos.
 */
router.post("/partner-applications", applicationLimiter, async (req, res) => {
  const { website, ...payload } = req.body ?? {};

  // Honeypot: campo invisível no formulário. Se vier preenchido, é bot —
  // respondemos como sucesso sem gravar nada.
  if (typeof website === "string" && website.trim() !== "") {
    res.status(201).json({ applicationId: null, token: null, message: "Cadastro recebido." });
    return;
  }

  const parsed = publicPartnerApplicationSchema.safeParse(payload);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }
  const data = parsed.data;

  const duplicateMessage = "Já existe um cadastro com este CNPJ. Fale com a equipe da Hospeda Link.";

  const existing = await prisma.partner.findFirst({
    where: { cnpj: data.cnpj },
    select: { id: true },
  });
  if (existing) {
    res.status(409).json({ error: duplicateMessage });
    return;
  }

  // Evita duas criações simultâneas com o mesmo CNPJ (duplo clique, duas abas)
  // no mesmo processo. Não substitui uma constraint única no banco.
  if (applicationsInFlight.has(data.cnpj)) {
    res.status(409).json({ error: duplicateMessage });
    return;
  }

  // A cota diária conta apenas cadastros válidos e inéditos: tentativas
  // inválidas ou duplicadas não podem esgotar o formulário para os demais.
  if (!consumeQuota("partner-applications", 30, 24 * 60 * 60 * 1000)) {
    res.status(429).json({
      error: "Recebemos muitos cadastros hoje. Tente novamente amanhã ou fale com a equipe.",
    });
    return;
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + APPLICATION_TOKEN_TTL_MS);

  const application = { ...data, status: "PENDING" as const, notes: "" };

  applicationsInFlight.add(data.cnpj);
  let partner: { id: string };
  try {
    partner = await prisma.partner.create({
      data: {
        ...partnerData(application),
        source: "PUBLIC",
        applicationTokenHash: hashToken(token),
        applicationTokenExpiresAt: expiresAt,
        roomTypes: { create: roomTypesCreate(data) },
        services: { create: servicesCreate(data) },
      },
      select: { id: true },
    });
  } finally {
    applicationsInFlight.delete(data.cnpj);
  }

  res.status(201).json({
    applicationId: partner.id,
    token,
    expiresAt: expiresAt.toISOString(),
    message: "Cadastro recebido.",
  });
});

/**
 * Fotos da candidatura, enviadas uma por requisição com o token devolvido no
 * cadastro. Só aceita enquanto o parceiro está PENDING e o token é válido.
 */
router.post(
  "/partner-applications/:id/images",
  applicationImageLimiter,
  express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: MAX_IMAGE_BYTES }),
  async (req: express.Request<{ id: string }>, res) => {
    const token = String(req.get("x-application-token") ?? "").trim();
    if (!token) {
      res.status(401).json({ error: "Envio de fotos não autorizado." });
      return;
    }

    const partner = await prisma.partner.findFirst({
      where: {
        id: req.params.id,
        status: "PENDING",
        source: "PUBLIC",
        applicationTokenHash: hashToken(token),
        applicationTokenExpiresAt: { gt: new Date() },
      },
      include: { images: true },
    });
    if (!partner) {
      res.status(404).json({
        error: "Cadastro não encontrado ou prazo para envio de fotos expirado.",
      });
      return;
    }
    if (!storageEnabled) {
      res.status(503).json({ error: "Armazenamento de imagens não configurado." });
      return;
    }

    const body = req.body;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      res.status(400).json({ error: "Envie a imagem como JPEG, PNG ou WEBP." });
      return;
    }
    const type = detectImageType(body);
    if (!type) {
      res.status(400).json({ error: "Arquivo não é uma imagem JPEG, PNG ou WEBP válida." });
      return;
    }
    if (partner.images.length >= MAX_PUBLIC_IMAGES) {
      res.status(400).json({ error: `Limite de ${MAX_PUBLIC_IMAGES} fotos por cadastro.` });
      return;
    }

    const key = `applications/${partner.id}/${crypto.randomUUID()}.${IMAGE_EXTENSION[type]}`;
    await putObject(key, body, type);

    const nextOrder = partner.images.reduce((max, img) => Math.max(max, img.sortOrder + 1), 0);
    const image = await prisma.partnerImage.create({
      data: { partnerId: partner.id, imageUrl: key, sortOrder: nextOrder },
    });

    res.status(201).json({ image: { id: image.id, sortOrder: image.sortOrder } });
  },
);

const publicInclude = { roomTypes: true, services: true, images: true } as const;

// Catálogo público: apenas parceiros ativos, sem dados de contato.
router.get("/partners", async (_req, res) => {
  const partners = await prisma.partner.findMany({
    where: { status: "ACTIVE" },
    include: publicInclude,
    orderBy: { tradeName: "asc" },
  });
  res.json({ partners: partners.map(serializePublicPartner) });
});

router.get("/partners/:id", async (req, res) => {
  const partner = await prisma.partner.findFirst({
    where: { id: req.params.id, status: "ACTIVE" },
    include: publicInclude,
  });
  if (!partner) {
    res.status(404).json({ error: "Parceiro não encontrado." });
    return;
  }
  res.json({ partner: serializePublicPartner(partner) });
});

router.get("/partner-images/:id", async (req, res) => {
  const image = await prisma.partnerImage.findUnique({
    where: { id: req.params.id },
    include: { partner: { select: { status: true } } },
  });
  if (!image || (!isExternalUrl(image.imageUrl) && !storageEnabled)) {
    res.status(404).json({ error: "Imagem não encontrada." });
    return;
  }
  // Fotos de candidaturas (e de parceiros inativos) só ficam visíveis para a
  // equipe logada; o catálogo público mostra apenas parceiros ACTIVE.
  if (image.partner.status !== "ACTIVE" && !(await hasAdminSession(req))) {
    res.status(404).json({ error: "Imagem não encontrada." });
    return;
  }
  const target = isExternalUrl(image.imageUrl) ? image.imageUrl : signedUrl(image.imageUrl);
  res.set("Cache-Control", `private, max-age=${signedUrlMaxAge}`);
  res.redirect(302, target);
});

export default router;
