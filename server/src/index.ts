import path from "node:path";
import { existsSync } from "node:fs";
import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.PORT ?? 3001);

const distPath = path.resolve(import.meta.dir, "../../client/dist");

if (process.env.NODE_ENV === "production" && existsSync(distPath)) {
  const express = await import("express");
  app.use(express.static(distPath));
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Hospeda Link API em http://localhost:${port}`);
});
