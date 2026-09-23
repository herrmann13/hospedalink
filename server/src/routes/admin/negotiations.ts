import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { negotiationStatusSchema } from "../../lib/statuses";
import { serializeNegotiation } from "../../lib/serialize";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const negotiations = await prisma.negotiation.findMany({
    include: { partner: true, request: { include: { company: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ negotiations: negotiations.map(serializeNegotiation) });
});

const patchSchema = z.object({
  status: negotiationStatusSchema.optional(),
  offeredDailyRate: z.number().optional().nullable(),
  notes: z.string().optional(),
});

router.patch("/:id", async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos." });
    return;
  }
  const data: Record<string, unknown> = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.offeredDailyRate !== undefined)
    data.offeredDailyRate = parsed.data.offeredDailyRate;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

  const negotiation = await prisma.negotiation.update({
    where: { id: req.params.id },
    data,
    include: { partner: true, request: { include: { company: true } } },
  });
  res.json({ negotiation: serializeNegotiation(negotiation) });
});

export default router;
