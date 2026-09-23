import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const [
    openRequests,
    negotiatingRequests,
    activeContracts,
    partners,
    contractsAgg,
  ] = await Promise.all([
    prisma.accommodationRequest.count({
      where: { status: { notIn: ["CONTRATO_FECHADO", "CANCELADA"] } },
    }),
    prisma.accommodationRequest.count({
      where: { status: { in: ["EM_NEGOCIACAO", "PROPOSTA_ENVIADA", "APROVADA"] } },
    }),
    prisma.contract.count({ where: { status: "ATIVO" } }),
    prisma.partner.count({ where: { status: "ACTIVE" } }),
    prisma.contract.aggregate({
      where: { status: { in: ["ATIVO", "FINALIZADO"] } },
      _sum: { totalAmount: true, commissionAmount: true, numberOfGuests: true },
    }),
  ]);

  res.json({
    stats: {
      openRequests,
      negotiatingRequests,
      activeContracts,
      partners,
      activeGuests: contractsAgg._sum.numberOfGuests ?? 0,
      totalNegotiated: contractsAgg._sum.totalAmount ?? 0,
      estimatedRevenue: contractsAgg._sum.commissionAmount ?? 0,
    },
  });
});

export default router;
