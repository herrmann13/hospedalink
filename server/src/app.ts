import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import publicRoutes from "./routes/public";
import adminRequests from "./routes/admin/requests";
import adminPartners from "./routes/admin/partners";
import adminNegotiations from "./routes/admin/negotiations";
import adminContracts from "./routes/admin/contracts";
import adminSettings from "./routes/admin/settings";
import adminDashboard from "./routes/admin/dashboard";
import { applyPtBrErrorMap } from "./lib/zodPtBr";

applyPtBrErrorMap();

const securityHeaders = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self'",
      // React aplica estilos inline; o restante vem do bundle compilado.
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      // Fotos passam por /api/partner-images e redirecionam para URL assinada do bucket.
      "img-src 'self' data: https:",
      "connect-src 'self'",
    ].join("; "),
  );
  next();
};

export function createApp() {
  const app = express();
  const configuredOrigin = process.env.CLIENT_ORIGIN;

  // O app roda atrás do proxy do Railway: confia no X-Forwarded-* para
  // protocolo, IP e cookies seguros.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(securityHeaders);

  if (process.env.NODE_ENV === "production" && !configuredOrigin) {
    throw new Error("CLIENT_ORIGIN é obrigatório em produção.");
  }

  const allowedOrigins = new Set(
    (configuredOrigin ?? "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api", publicRoutes);
  app.use("/api/admin/dashboard", adminDashboard);
  app.use("/api/admin/requests", adminRequests);
  app.use("/api/admin/partners", adminPartners);
  app.use("/api/admin/negotiations", adminNegotiations);
  app.use("/api/admin/contracts", adminContracts);
  app.use("/api/admin/settings", adminSettings);

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({ error: "Rota não encontrada." });
      return;
    }
    next();
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err?.type === "entity.too.large") {
      res.status(413).json({ error: "Arquivo muito grande (máximo de 5 MB)." });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  });

  return app;
}
