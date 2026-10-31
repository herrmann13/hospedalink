import path from "node:path";
import { existsSync } from "node:fs";
import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.PORT ?? 3001);

const distPath = path.resolve(import.meta.dir, "../../client/dist");

// Rotas que existem no React Router. Deep links recebem o index.html com 200;
// qualquer outra URL recebe o index.html com 404 (a SPA mostra a página
// "não encontrada") para não gerar soft 404 nos buscadores.
const publicRoutes = [
  /^\/$/,
  /^\/solicitar-hospedagem$/,
  /^\/seja-parceiro$/,
  /^\/parceiros$/,
  /^\/parceiros\/[^/]+$/,
  /^\/privacidade$/,
  /^\/termos$/,
];
const adminRoutes = /^\/admin(?:\/.*)?$/;

const publicPaths = [
  "/",
  "/parceiros",
  "/solicitar-hospedagem",
  "/seja-parceiro",
  "/privacidade",
  "/termos",
];

const configuredOrigin = (process.env.CLIENT_ORIGIN ?? "").split(",")[0]?.trim() ?? "";

const originOf = (req: { protocol: string; get: (name: string) => string | undefined }) =>
  configuredOrigin || `${req.protocol}://${req.get("host") ?? "localhost"}`;

if (process.env.NODE_ENV === "production" && existsSync(distPath)) {
  const express = await import("express");

  // robots.txt sem menção ao painel: /admin não é linkado em nenhuma página.
  app.get("/robots.txt", (req, res) => {
    res
      .type("text/plain")
      .set("Cache-Control", "public, max-age=86400")
      .send(`User-agent: *\nAllow: /\n\nSitemap: ${originOf(req)}/sitemap.xml\n`);
  });

  app.get("/sitemap.xml", (req, res) => {
    const origin = originOf(req);
    const urls = publicPaths.map((p) => `  <url><loc>${origin}${p}</loc></url>`).join("\n");
    res
      .type("application/xml")
      .set("Cache-Control", "public, max-age=86400")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      );
  });

  app.use(
    express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        // Arquivos em /assets têm hash no nome: podem ser cacheados para sempre.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return;
        }
        res.setHeader("Cache-Control", "public, max-age=3600");
      },
    }),
  );

  app.use((req, res) => {
    const isAdmin = adminRoutes.test(req.path);
    if (isAdmin) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    }
    const known = isAdmin || publicRoutes.some((route) => route.test(req.path));
    res.status(known ? 200 : 404);
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Hospeda Link API em http://localhost:${port}`);
});
