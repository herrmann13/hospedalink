import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { serializeRequest } from "../../lib/serialize";
import { getCommissionRate } from "../../lib/protocol";
import { requireAuth } from "../../middleware/auth";
import { negotiationStatusSchema, requestStatusSchema } from "../../lib/statuses";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const requests = await prisma.accommodationRequest.findMany({
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ requests: requests.map(serializeRequest) });
});

router.get("/:id", async (req, res) => {
  const request = await prisma.accommodationRequest.findUnique({
    where: { id: req.params.id },
    include: {
      company: true,
      requirements: true,
      negotiations: { include: { partner: true }, orderBy: { createdAt: "desc" } },
      proposals: { include: { partner: true }, orderBy: { createdAt: "desc" } },
      contracts: { include: { partner: true } },
    },
  });
  if (!request) {
    res.status(404).json({ error: "Solicitação não encontrada." });
    return;
  }
  res.json({ request: serializeRequest(request) });
});

const patchSchema = z.object({
  status: requestStatusSchema.optional(),
  internalNotes: z.string().optional(),
});

router.patch("/:id", async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos." });
    return;
  }
  const data: Record<string, unknown> = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.internalNotes !== undefined) data.internalNotes = parsed.data.internalNotes;

  const request = await prisma.accommodationRequest.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ request: serializeRequest(request) });
});

const negotiationSchema = z.object({
  partnerId: z.string().min(1),
  status: negotiationStatusSchema.default("AGUARDANDO_RETORNO"),
  offeredDailyRate: z.number().optional().nullable(),
  notes: z.string().optional().default(""),
});

router.post("/:id/negotiations", async (req, res) => {
  const parsed = negotiationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos." });
    return;
  }
  const negotiation = await prisma.negotiation.create({
    data: {
      requestId: req.params.id,
      partnerId: parsed.data.partnerId,
      status: parsed.data.status,
      offeredDailyRate: parsed.data.offeredDailyRate ?? null,
      notes: parsed.data.notes || null,
    },
    include: { partner: true },
  });
  res.status(201).json({ negotiation });
});

const proposalSchema = z.object({
  negotiationId: z.string().optional().nullable(),
  partnerId: z.string().min(1),
  numberOfGuests: z.number().int().min(1),
  dailyRate: z.number().min(0),
  numberOfDays: z.number().int().min(1),
  servicesDescription: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

router.post("/:id/proposals", async (req, res) => {
  const parsed = proposalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos." });
    return;
  }
  const d = parsed.data;
  const rate = await getCommissionRate();

  const amount = round2(d.numberOfGuests * d.dailyRate * d.numberOfDays);
  const commission = round2(amount * (rate / 100));
  const totalAmount = round2(amount + commission);

  const proposal = await prisma.proposal.create({
    data: {
      negotiationId: d.negotiationId || null,
      requestId: req.params.id,
      partnerId: d.partnerId,
      numberOfGuests: d.numberOfGuests,
      numberOfDays: d.numberOfDays,
      dailyRate: d.dailyRate,
      amount,
      commission,
      totalAmount,
      commissionPercentage: rate,
      servicesDescription: d.servicesDescription || null,
      notes: d.notes || null,
    },
    include: { partner: true },
  });

  res.status(201).json({ proposal });
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default router;
