import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const setting = await prisma.setting.findUnique({ where: { key: "commissionRate" } });
  res.json({ commissionRate: Number(setting?.value ?? "10") });
});

const patchSchema = z.object({ commissionRate: z.number().min(0).max(100) });

router.patch("/", async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Informe uma taxa válida." });
    return;
  }
  await prisma.setting.upsert({
    where: { key: "commissionRate" },
    create: { key: "commissionRate", value: String(parsed.data.commissionRate) },
    update: { value: String(parsed.data.commissionRate) },
  });
  res.json({ commissionRate: parsed.data.commissionRate });
});

export default router;
