import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { COOKIE_NAME, signToken } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Informe e-mail e senha." });
    return;
  }

  const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Credenciais inválidas." });
    return;
  }

  const token = await signToken({ sub: user.id, email: user.email, name: user.name });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.status(204).end();
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user!.sub, email: req.user!.email, name: req.user!.name } });
});

export default router;
