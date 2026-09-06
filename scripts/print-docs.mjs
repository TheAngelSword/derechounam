import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

const docs = path.resolve("/workspace/docs");
const files = ["RESUMEN-DEL-PROYECTO.html", "GUIA-RAPIDA.html", "DESPLIEGUE.html"];

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage();
for (const file of files) {
  const html = path.join(docs, file);
  const pdf = path.join(docs, file.replace(/\.html$/, ".pdf"));
  await page.goto(pathToFileURL(html).href, { waitUntil: "load" });
  await page.pdf({
    path: pdf,
    format: "A4",
    printBackground: true,
    margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" },
  });
  console.log("wrote", pdf);
}
await browser.close();
