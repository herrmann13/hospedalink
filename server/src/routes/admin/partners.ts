import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { serializePartner } from "../../lib/serialize";
import { requireAuth } from "../../middleware/auth";
import { partnerStatusSchema } from "../../lib/statuses";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const partners = await prisma.partner.findMany({
    include: { roomTypes: true, services: true, images: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ partners: partners.map(serializePartner) });
});

router.get("/:id", async (req, res) => {
  const partner = await prisma.partner.findUnique({
    where: { id: req.params.id },
    include: { roomTypes: true, services: true, images: true },
  });
  if (!partner) {
    res.status(404).json({ error: "Parceiro não encontrado." });
    return;
  }
  res.json({ partner: serializePartner(partner) });
});

const patchSchema = z.object({
  status: partnerStatusSchema.optional(),
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
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
  if (parsed.data.availableCapacity !== undefined)
    data.availableCapacity = parsed.data.availableCapacity;

  const partner = await prisma.partner.update({
    where: { id: req.params.id },
    data,
    include: { roomTypes: true, services: true, images: true },
  });
  res.json({ partner: serializePartner(partner) });
});

export default router;
