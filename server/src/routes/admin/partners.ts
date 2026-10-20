import express, { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { serializePartner } from "../../lib/serialize";
import { requireAuth } from "../../middleware/auth";
import { partnerCategorySchema, partnerStatusSchema } from "../../lib/statuses";
import { partnerData, partnerInputSchema, roomTypesCreate, servicesCreate } from "../../lib/partnerInput";
import {
  IMAGE_EXTENSION,
  MAX_IMAGE_BYTES,
  deleteObject,
  detectImageType,
  isExternalUrl,
  putObject,
  storageEnabled,
} from "../../lib/storage";

const router = Router();
router.use(requireAuth);

const include = { roomTypes: true, services: true, images: true } as const;
const MAX_IMAGES = 10;

router.get("/", async (_req, res) => {
  const partners = await prisma.partner.findMany({
    include,
    orderBy: { createdAt: "desc" },
  });
  res.json({ partners: partners.map(serializePartner) });
});

router.get("/:id", async (req, res) => {
  const partner = await prisma.partner.findUnique({
    where: { id: req.params.id },
    include,
  });
  if (!partner) {
    res.status(404).json({ error: "Parceiro não encontrado." });
    return;
  }
  res.json({ partner: serializePartner(partner) });
});

router.post("/", async (req, res) => {
  const parsed = partnerInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }
  const data = parsed.data;

  const partner = await prisma.partner.create({
    data: {
      ...partnerData(data),
      roomTypes: { create: roomTypesCreate(data) },
      services: { create: servicesCreate(data) },
    },
    include,
  });
  res.status(201).json({ partner: serializePartner(partner) });
});

router.put("/:id", async (req, res) => {
  const parsed = partnerInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }
  const data = parsed.data;

  const existing = await prisma.partner.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Parceiro não encontrado." });
    return;
  }

  const [, , partner] = await prisma.$transaction([
    prisma.roomType.deleteMany({ where: { partnerId: existing.id } }),
    prisma.partnerService.deleteMany({ where: { partnerId: existing.id } }),
    prisma.partner.update({
      where: { id: existing.id },
      data: {
        ...partnerData(data),
        roomTypes: { create: roomTypesCreate(data) },
        services: { create: servicesCreate(data) },
      },
      include,
    }),
  ]);
  res.json({ partner: serializePartner(partner) });
});

router.delete("/:id", async (req, res) => {
  const partner = await prisma.partner.findUnique({
    where: { id: req.params.id },
    include: {
      images: true,
      _count: { select: { negotiations: true, proposals: true, contracts: true } },
    },
  });
  if (!partner) {
    res.status(404).json({ error: "Parceiro não encontrado." });
    return;
  }

  // Negociações, propostas e contratos guardam o histórico comercial; nesses casos, inative.
  const { negotiations, proposals, contracts } = partner._count;
  if (negotiations + proposals + contracts > 0) {
    res.status(409).json({
      error:
        "Este parceiro tem negociações, propostas ou contratos vinculados e não pode ser excluído. Altere o status para Inativo.",
    });
    return;
  }

  // Quartos, comodidades e fotos são removidos em cascata.
  await prisma.partner.delete({ where: { id: partner.id } });

  if (storageEnabled) {
    const keys = partner.images.map((img) => img.imageUrl).filter((url) => !isExternalUrl(url));
    await Promise.all(
      keys.map((key) =>
        deleteObject(key).catch((error) => console.error("Falha ao remover imagem do bucket:", error)),
      ),
    );
  }

  res.status(204).end();
});

const patchSchema = z.object({
  status: partnerStatusSchema.optional(),
  category: partnerCategorySchema.optional(),
  notes: z.string().optional(),
  availableCapacity: z.number().int().min(0).optional(),
});

router.patch("/:id", async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos." });
    return;
  }
  const data: Record<string, unknown> = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.category) data.category = parsed.data.category;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
  if (parsed.data.availableCapacity !== undefined)
    data.availableCapacity = parsed.data.availableCapacity;

  const partner = await prisma.partner.update({
    where: { id: req.params.id },
    data,
    include,
  });
  res.json({ partner: serializePartner(partner) });
});

// Upload de uma foto por requisição: corpo binário com Content-Type image/jpeg|png|webp.
router.post(
  "/:id/images",
  express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: MAX_IMAGE_BYTES }),
  async (req, res) => {
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

    const partner = await prisma.partner.findUnique({
      where: { id: req.params.id },
      include: { images: true },
    });
    if (!partner) {
      res.status(404).json({ error: "Parceiro não encontrado." });
      return;
    }
    if (partner.images.length >= MAX_IMAGES) {
      res.status(400).json({ error: `Limite de ${MAX_IMAGES} fotos por parceiro.` });
      return;
    }

    const key = `partners/${partner.id}/${crypto.randomUUID()}.${IMAGE_EXTENSION[type]}`;
    await putObject(key, body, type);

    const nextOrder = partner.images.reduce((max, img) => Math.max(max, img.sortOrder + 1), 0);
    await prisma.partnerImage.create({
      data: { partnerId: partner.id, imageUrl: key, sortOrder: nextOrder },
    });

    const updated = await prisma.partner.findUniqueOrThrow({ where: { id: partner.id }, include });
    res.status(201).json({ partner: serializePartner(updated) });
  },
);

router.delete("/:id/images/:imageId", async (req, res) => {
  const image = await prisma.partnerImage.findFirst({
    where: { id: req.params.imageId, partnerId: req.params.id },
  });
  if (!image) {
    res.status(404).json({ error: "Imagem não encontrada." });
    return;
  }

  await prisma.partnerImage.delete({ where: { id: image.id } });
  if (!isExternalUrl(image.imageUrl) && storageEnabled) {
    await deleteObject(image.imageUrl).catch((error) =>
      console.error("Falha ao remover imagem do bucket:", error),
    );
  }

  const updated = await prisma.partner.findUniqueOrThrow({ where: { id: req.params.id }, include });
  res.json({ partner: serializePartner(updated) });
});

export default router;
