import type { NextFunction, Request, Response } from "express";
import { COOKIE_NAME, verifyToken, type TokenPayload } from "../lib/jwt";

export interface AuthedRequest extends Request {
  user?: TokenPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }
  verifyToken(token).then((payload) => {
    if (!payload) {
      res.status(401).json({ error: "Sessão inválida ou expirada." });
      return;
    }
    (req as AuthedRequest).user = payload;
    next();
  });
}
