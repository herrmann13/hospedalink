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

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
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
    console.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  });

  return app;
}
