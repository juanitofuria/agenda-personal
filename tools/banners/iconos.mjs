// Genera los iconos de la app instalable (PWA) en cloudflare/publico/app/: node iconos.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const salida = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "cloudflare", "publico", "app");
mkdirSync(salida, { recursive: true });

/** El calendario con el tic sobre un fondo azul. `margen`: parte del lado que se deja libre (los iconos «maskable» lo necesitan). */
const svg = (tam, margen, redondeo) => {
  const s = (1 - margen * 2) * tam / 64, o = margen * tam;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}">
  <defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4aa3ff"/><stop offset="1" stop-color="#2757b8"/></linearGradient></defs>
  <rect width="${tam}" height="${tam}" rx="${redondeo}" fill="url(#f)"/>
  <g transform="translate(${o} ${o}) scale(${s})">
    <rect x="9" y="12" width="46" height="42" rx="10" fill="#fff"/>
    <path d="M9 22a10 10 0 0 1 10-10h26a10 10 0 0 1 10 10v4H9z" fill="#ef4a5a"/>
    <rect x="20" y="5" width="5" height="12" rx="2.5" fill="#dfe9f8"/><rect x="39" y="5" width="5" height="12" rx="2.5" fill="#dfe9f8"/>
    <path d="M22 40l7 7 14-15" fill="none" stroke="#27a85a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </g></svg>`;
};

const iconos = [
  ["icon-192.png", 192, 0.1, 40],
  ["icon-512.png", 512, 0.1, 108],
  ["icon-maskable-512.png", 512, 0.2, 0],   // a sangre: el sistema la recorta (círculo, cuadrado redondeado…)
  ["apple-touch-icon.png", 180, 0.1, 0],    // iOS pone sus propias esquinas
];
const b = await chromium.launch({ executablePath: process.env.CHROME ?? undefined, args: ["--no-sandbox"] });
for (const [nombre, tam, margen, red] of iconos) {
  const p = await b.newPage({ viewport: { width: tam, height: tam } });
  await p.setContent(`<body style="margin:0;background:transparent">${svg(tam, margen, red)}</body>`);
  await p.screenshot({ path: join(salida, nombre), omitBackground: true });
  await p.close();
}
await b.close();
console.log("iconos listos en", salida);
