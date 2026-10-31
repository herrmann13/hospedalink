import type { NextFunction, Request, Response } from "express";

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();
const quotas = new Map<string, Entry>();

function prune(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

/**
 * IP do cliente para limitar taxa.
 *
 * Em produção o app roda atrás do edge do Railway, que sobrescreve o header
 * `X-Real-IP` com o IP de conexão e não garante um número fixo de saltos no
 * `X-Forwarded-For`. Por isso usamos `X-Real-IP` (e não `req.ip`) quando em
 * produção; fora dela caímos no endereço do socket.
 */
export function clientIp(req: Request): string {
  if (process.env.NODE_ENV === "production") {
    const realIp = req.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }
  return req.ip ?? req.socket.remoteAddress ?? "desconhecido";
}

/**
 * Limitador de taxa em memória por IP (janela fixa).
 * Suficiente para conter abuso simples; reinícios do processo zeram os contadores
 * e múltiplas réplicas teriam contadores independentes.
 */
export function rateLimit(options: { name: string; max: number; windowMs: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    prune(now);

    const key = `${options.name}:${clientIp(req)}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (current.count >= options.max) {
      res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." });
      return;
    }

    current.count += 1;
    next();
  };
}

/** Cota global (todas as origens), usada para limitar o volume total de cadastros. */
export function consumeQuota(name: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const current = quotas.get(name);

  if (!current || current.resetAt <= now) {
    quotas.set(name, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;

  current.count += 1;
  return true;
}
