/**
 * Gera o PDF de negócio a partir de docs/como-o-negocio-funciona.md.
 *
 * Uso: bun run scripts/gerar-pdf.ts
 * Saída: docs/como-o-negocio-funciona.pdf
 *
 * O script converte o Markdown em HTML estilizado (com a identidade visual da
 * Hospeda Link) e usa o Chrome headless para imprimir em PDF. Não há
 * dependências externas.
 */

import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const mdPath = join(root, "docs", "como-o-negocio-funciona.md");
const outPdf = join(root, "docs", "como-o-negocio-funciona.pdf");

// ---------------------------------------------------------------------------
// Conversor Markdown -> HTML (subconjunto controlado)
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  s = escapeHtml(s);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return s;
}

function mdToHtml(md: string): string {
  const lines = md.split("\n");
  let html = "";
  // Pilha de listas abertas: { tag, indent }, com indent em espaços.
  const stack: { tag: string; indent: number }[] = [];

  const closeTo = (indent: number) => {
    while (stack.length && stack[stack.length - 1].indent > indent) {
      const top = stack.pop()!;
      html += top.tag === "ul" ? "</ul>\n" : "</ol>\n";
    }
  };
  const closeAll = () => closeTo(-1);

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      closeAll();
      html += "<hr />\n";
      i++;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeAll();
      const level = heading[1].length;
      html += `<h${level}>${inline(heading[2])}</h${level}>\n`;
      i++;
      continue;
    }

    if (trimmed.startsWith(">")) {
      closeAll();
      let content = "";
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        content += lines[i].trim().replace(/^>\s?/, "") + " ";
        i++;
      }
      html += `<blockquote>${inline(content.trim())}</blockquote>\n`;
      continue;
    }

    const ul = trimmed.match(/^[-*]\s+(.*)$/);
    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ul || ol) {
      const tag = ul ? "ul" : "ol";
      const content = (ul ? ul[1] : ol[1])!;
      const indent = raw.length - raw.trimStart().length;
      const top = stack[stack.length - 1];

      if (!top || indent > top.indent) {
        // Nível mais profundo: abre uma nova lista aninhada.
        stack.push({ tag, indent });
        html += `<${tag}>\n`;
      } else {
        closeTo(indent);
        const current = stack[stack.length - 1];
        if (!current || current.indent !== indent) {
          stack.push({ tag, indent });
          html += `<${tag}>\n`;
        } else if (current.tag !== tag) {
          // Mesma indentação, tipo diferente: fecha e reabre.
          const closed = stack.pop()!;
          html += closed.tag === "ul" ? "</ul>\n" : "</ol>\n";
          stack.push({ tag, indent });
          html += `<${tag}>\n`;
        }
        // Caso contrário, continua na mesma lista.
      }
      html += `<li>${inline(content)}</li>\n`;
      i++;
      continue;
    }

    closeAll();
    html += `<p>${inline(trimmed)}</p>\n`;
    i++;
  }
  closeAll();
  return html;
}

// ---------------------------------------------------------------------------
// Casca HTML com a identidade visual da Hospeda Link
// ---------------------------------------------------------------------------

const css = `
  :root {
    --brand: #0e2a47;
    --brand-strong: #0a1f33;
    --accent: #1f7a5c;
    --accent-strong: #18614a;
    --accent-soft: #e4f1ec;
    --brand-50: #eef3f8;
    --ink: #1c2631;
    --muted: #5b6673;
    --border: #e3e8ee;
  }

  * { box-sizing: border-box; }

  @page {
    size: A4;
    margin: 16mm 17mm 18mm;
  }

  html, body {
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: var(--ink);
    font-size: 11pt;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .doc { max-width: 720px; margin: 0 auto; }

  .masthead {
    background: var(--brand);
    color: #fff;
    padding: 26px 30px 24px;
    border-radius: 10px;
    margin-bottom: 26px;
  }
  .masthead .kicker {
    font-size: 9pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #9fd6c2;
    margin: 0 0 8px;
  }
  .masthead h1 {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
    font-size: 23pt;
    line-height: 1.15;
    margin: 0;
    letter-spacing: -0.01em;
  }
  .masthead .rule {
    width: 44px;
    height: 4px;
    background: var(--accent);
    border-radius: 2px;
    margin: 14px 0;
  }
  .masthead p {
    color: #d5e0ec;
    margin: 0;
    font-size: 10.5pt;
    max-width: 52ch;
  }

  h2 {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
    font-size: 16pt;
    color: var(--brand);
    margin: 30px 0 10px;
    padding-top: 14px;
    border-top: 2px solid var(--border);
    break-after: avoid;
    page-break-after: avoid;
  }
  h2:first-of-type { border-top: none; }

  h3 {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
    font-size: 12.5pt;
    color: var(--accent-strong);
    margin: 20px 0 6px;
    break-after: avoid;
    page-break-after: avoid;
  }

  p { margin: 8px 0; }
  strong { color: var(--brand); font-weight: 650; }

  blockquote {
    margin: 14px 0;
    padding: 12px 16px;
    background: var(--accent-soft);
    border-left: 4px solid var(--accent);
    border-radius: 0 8px 8px 0;
    color: #27424f;
  }
  blockquote p { margin: 0; }

  ul, ol { margin: 8px 0 12px; padding-left: 22px; }
  li { margin: 4px 0; padding-left: 2px; }
  ul li::marker { color: var(--accent); }
  ol li::marker { color: var(--accent); font-weight: 700; }

  code {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 9.5pt;
    background: var(--brand-50);
    color: var(--brand);
    padding: 1px 5px;
    border-radius: 4px;
  }

  hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 18px 0;
  }

  h2, h3, li, blockquote { break-inside: avoid; page-break-inside: avoid; }
`;

function buildHtml(body: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Hospeda Link: Regras do negócio</title>
<style>${css}</style>
</head>
<body>
  <div class="doc">
    <header class="masthead">
      <p class="kicker">Hospeda Link</p>
      <h1>Regras do negócio</h1>
      <div class="rule"></div>
      <p>Central de hospedagem corporativa em Jataí-GO. Como o negócio opera e como a ferramenta apoia a operação.</p>
    </header>
    ${body}
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

const md = readFileSync(mdPath, "utf8");
const body = mdToHtml(md.replace(/^#\s+.*$/m, "")); // remove o título H1 duplicado do markdown
const html = buildHtml(body);

const dir = mkdtempSync(join(tmpdir(), "hospeda-pdf-"));
const htmlPath = join(dir, "documento.html");
writeFileSync(htmlPath, html);

const chrome = "/usr/bin/google-chrome";
execFileSync(
  chrome,
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--no-pdf-header-footer",
    `--print-to-pdf=${outPdf}`,
    `file://${htmlPath}`,
  ],
  { stdio: "inherit" },
);

console.log(`PDF gerado em: ${outPdf}`);
