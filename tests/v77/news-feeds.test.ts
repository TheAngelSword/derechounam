import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_NEWS_SOURCES, mergeSettings, safeImageUrl } from "../../src/lib/news/sources.ts";
import { parseOfficialHtml, plainText } from "../../src/lib/news/parser.ts";

test("Gaceta Derecho usa el RSS verificado y la Corte tiene RSS oficial", () => {
  const gaceta = DEFAULT_NEWS_SOURCES.find((source) => source.id === "gaceta");
  const corte = DEFAULT_NEWS_SOURCES.find((source) => source.id === "scjn-rss");
  assert.equal(gaceta?.kind, "rss");
  assert.equal(gaceta?.url, "https://www.gaceta.unam.mx/tag/facultad-de-derecho/feed/");
  assert.equal(corte?.enabled, true);
  assert.equal(corte?.url, "https://www.scjn.gob.mx/rss.xml");
  assert.equal(DEFAULT_NEWS_SOURCES.find((source) => source.id === "scjn")?.enabled, false);
});

test("una configuración vieja de Gaceta pasa al RSS comprobado", () => {
  const merged = mergeSettings({ sources: [{ id: "gaceta", url: "https://www.gaceta.unam.mx/tag/facultad-de-derecho/", kind: "html", enabled: true }] });
  const gaceta = merged.sources.find((source) => source.id === "gaceta");
  assert.equal(gaceta?.kind, "rss");
  assert.match(gaceta?.url ?? "", /\/feed\/$/);
});

test("el DOF no duplica la misma nota con un año corrido", () => {
  const dof = DEFAULT_NEWS_SOURCES.find((source) => source.id === "dof")!;
  const html = `<a href="/nota_detalle.php?codigo=5802077&amp;fecha=23/10/1926">Decreto por el que se reforman y adicionan diversas disposiciones de la Ley Aduanera.</a><a href="/nota_detalle.php?codigo=5802077&amp;fecha=23/10/2026">Decreto por el que se reforman y adicionan diversas disposiciones de la Ley Aduanera.</a>`;
  const rows = parseOfficialHtml(html, dof);
  assert.equal(rows.length, 1);
  assert.match(rows[0]?.sourceUrl ?? "", /2026/);
});

test("los títulos oficiales conservan acentos", () => {
  assert.equal(plainText("&Iacute;ndice &ntilde;"), "Índice ñ");
  assert.equal(safeImageUrl("https://scjn.gob.mx/foto.jpg", "https://www.scjn.gob.mx/rss.xml"), "https://scjn.gob.mx/foto.jpg");
});
