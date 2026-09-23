import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { contractStatusSchema } from "../../lib/statuses";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const contracts = await prisma.contract.findMany({
    include: { partner: true, company: true, request: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ contracts });
});

const createSchema = z.object({
  proposalId: z.string().min(1),
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Proposta inválida." });
    return;
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: parsed.data.proposalId },
    include: { request: true },
  });
  if (!proposal) {
    res.status(404).json({ error: "Proposta não encontrada." });
    return;
  }

  const existing = await prisma.contract.findUnique({
    where: { proposalId: proposal.id },
  });
  if (existing) {
    res.status(409).json({ error: "Esta proposta já virou contrato." });
    return;
  }

  const contract = await prisma.contract.create({
    data: {
      requestId: proposal.requestId,
      proposalId: proposal.id,
      companyId: proposal.request.companyId,
      partnerId: proposal.partnerId,
      checkIn: proposal.request.checkIn,
      checkOut: proposal.request.checkOut,
      numberOfGuests: proposal.numberOfGuests ?? proposal.request.numberOfGuests,
      accommodationAmount: proposal.amount,
      commissionPercentage: proposal.commissionPercentage ?? 10,
      commissionAmount: proposal.commission,
      totalAmount: proposal.totalAmount,
      status: "AGUARDANDO_ASSINATURA",
    },
    include: { partner: true, company: true },
  });

  await prisma.$transaction([
    prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "CONVERTIDA" },
    }),
    prisma.accommodationRequest.update({
      where: { id: proposal.requestId },
      data: { status: "CONTRATO_FECHADO" },
    }),
  ]);

  res.status(201).json({ contract });
});

const patchSchema = z.object({ status: contractStatusSchema });

router.patch("/:id", async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos." });
    return;
  }
  const contract = await prisma.contract.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
    include: { partner: true, company: true },
  });
  res.json({ contract });
});

export default router;
