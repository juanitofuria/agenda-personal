// Genera las 4 cabeceras del menú: informal/formal x claro/oscuro. Uso: npm install && npm run generar
// Necesita Chromium (variable CHROMIUM o /opt/pw-browsers/chromium-*/chrome-linux/chrome).
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const salida = join(aqui, "..", "..", "cloudflare", "publico");
mkdirSync(salida, { recursive: true });

const fuente = (paquete, archivo, familia, peso) =>
  `@font-face{font-family:'${familia}';font-weight:${peso};src:url(data:font/woff2;base64,${readFileSync(join(aqui, "node_modules", "@fontsource", paquete, "files", archivo)).toString("base64")}) format('woff2');}`;
const FUENTES = [
  fuente("nunito", "nunito-latin-800-normal.woff2", "Nunito", 800), fuente("nunito", "nunito-latin-700-normal.woff2", "Nunito", 700),
  fuente("playfair-display", "playfair-display-latin-700-normal.woff2", "Playfair", 700),
  fuente("caveat", "caveat-latin-700-normal.woff2", "Caveat", 700),
].join("\n");

const W = 1280, H = 400;

/** Icono de calendario con marca de verificación. */
const calendario = ({ marco, relleno, aro, check, grosor = 9, tapa = null }) => `
<svg width="190" height="190" viewBox="0 0 190 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="22" y="38" width="146" height="132" rx="26" fill="${relleno}" stroke="${marco}" stroke-width="${grosor}"/>
  ${tapa ? `<path d="M22 64 a26 26 0 0 1 26 -26 h94 a26 26 0 0 1 26 26 v14 h-146z" fill="${tapa}"/>` : `<path d="M22 84 h146" stroke="${marco}" stroke-width="${grosor}"/>`}
  <rect x="58" y="12" width="14" height="44" rx="7" fill="${aro}"/><rect x="118" y="12" width="14" height="44" rx="7" fill="${aro}"/>
  <path d="M62 128 l22 22 l46 -50" fill="none" stroke="${check}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Paisaje del estilo informal: montañas, sol, nubes, pinos y lago. */
const paisaje = (oscuro) => `
<svg width="640" height="400" viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" style="position:absolute;right:0;top:0">
  <defs>
    <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe0fb"/><stop offset="1" stop-color="#f4faff"/></linearGradient>
    <radialGradient id="sol" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff3b0"/><stop offset="0.45" stop-color="#ffd35c"/><stop offset="1" stop-color="#ffd35c" stop-opacity="0"/></radialGradient>
    <linearGradient id="lago" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd3f5"/><stop offset="1" stop-color="#5fa8dd"/></linearGradient>
    <linearGradient id="fundido" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${oscuro ? "#0d1b34" : "#f1f7fd"}" stop-opacity="1"/><stop offset="0.28" stop-color="${oscuro ? "#0d1b34" : "#f1f7fd"}" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#cielo)"/>
  <circle cx="395" cy="150" r="120" fill="url(#sol)"/>
  <g fill="#fff" opacity="0.95"><ellipse cx="560" cy="62" rx="70" ry="22"/><ellipse cx="600" cy="48" rx="46" ry="22"/><ellipse cx="505" cy="70" rx="40" ry="16"/>
     <ellipse cx="205" cy="250" rx="60" ry="14" opacity="0.8"/></g>
  <polygon points="40,330 230,150 330,260 420,130 640,330" fill="#9ec3ea"/>
  <polygon points="150,330 330,120 470,330" fill="#6f9fd8"/>
  <polygon points="330,120 292,176 316,168 332,190 350,166 372,176" fill="#fff"/>
  <polygon points="390,330 560,175 640,260 640,330" fill="#82aee0"/>
  <rect y="318" width="640" height="82" fill="url(#lago)"/>
  <path d="M0 322 h640" stroke="#fff" stroke-opacity="0.5" stroke-width="3"/>
  <g fill="#2f7d4f"><polygon points="520,330 540,250 560,330"/><polygon points="548,330 574,225 600,330"/><polygon points="585,330 610,260 636,330"/>
     <polygon points="492,330 508,275 524,330"/></g>
  <g fill="#256640"><polygon points="560,330 574,225 588,330" opacity="0.35"/></g>
  <rect width="640" height="400" fill="url(#fundido)"/>
</svg>`;

/** Escritorio del estilo formal: libreta de cuero, bolígrafo y plantas desenfocadas. */
const escritorio = (oscuro) => `
<svg width="540" height="400" viewBox="160 0 540 400" preserveAspectRatio="xMaxYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;right:0;top:0">
  <defs>
    <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${oscuro ? "#101c30" : "#2a3340"}"/><stop offset="1" stop-color="${oscuro ? "#060d1b" : "#0f1620"}"/></linearGradient>
    <linearGradient id="mesa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a323f"/><stop offset="1" stop-color="#0c121b"/></linearGradient>
    <linearGradient id="cuero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3f48"/><stop offset="1" stop-color="#14181f"/></linearGradient>
    <linearGradient id="oro" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a6a2c"/><stop offset="0.5" stop-color="#f3d98a"/><stop offset="1" stop-color="#8a6a2c"/></linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
    <linearGradient id="fundido" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${oscuro ? "#0b1a33" : "#ffffff"}" stop-opacity="1"/><stop offset="0.3" stop-color="${oscuro ? "#0b1a33" : "#ffffff"}" stop-opacity="0"/></linearGradient>
  </defs>
  <rect x="160" width="540" height="400" fill="url(#fondo)"/>
  <g filter="url(#blur)" opacity="0.75"><circle cx="330" cy="70" r="46" fill="#5d8a52"/><circle cx="372" cy="46" r="34" fill="#7aa466"/><rect x="318" y="96" width="70" height="70" rx="12" fill="#6b7480"/>
     <circle cx="610" cy="90" r="40" fill="#f0b565" opacity="0.55"/><circle cx="560" cy="60" r="22" fill="#9ec3ff" opacity="0.5"/></g>
  <rect y="190" width="700" height="210" fill="url(#mesa)"/>
  <g transform="translate(250 205) rotate(-9)"><rect width="330" height="170" rx="16" fill="url(#cuero)"/><rect x="12" y="10" width="306" height="150" rx="10" fill="none" stroke="#fff" stroke-opacity="0.08"/>
     <rect x="296" y="0" width="16" height="170" fill="#0d1117" opacity="0.6"/></g>
  <g transform="translate(300 262) rotate(-10)"><rect width="320" height="14" rx="7" fill="url(#oro)"/><rect x="40" y="2" width="170" height="10" rx="5" fill="#0b0f15"/><polygon points="320,0 350,7 320,14" fill="#cfd5dd"/></g>
  <rect x="160" width="540" height="400" fill="url(#fundido)"/>
</svg>`;

const base = `${FUENTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;font-family:'Nunito',sans-serif}
.manuscrito{font-family:'Caveat',cursive;font-weight:700;position:absolute;line-height:1.0}
.trazo{position:absolute}`;

const informalClaro = `<style>${base}
body{background:linear-gradient(115deg,#f9fcff 0%,#eaf3fc 55%,#dcebfa 100%)}
.circulo{position:absolute;left:46px;top:96px;width:208px;height:208px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffffff,#d9e9fa 70%);box-shadow:0 14px 40px rgba(60,120,200,.18)}
.circulo svg{position:absolute;left:9px;top:11px}
h1{position:absolute;left:300px;top:122px;font-weight:800;font-size:72px;color:#0f2347;letter-spacing:-1px;white-space:nowrap}
.sub{position:absolute;left:304px;top:222px;font-weight:700;font-size:38px;color:#4a5f86}
</style>${paisaje(false)}
<div class="circulo">${calendario({ marco: "#2f6fd6", relleno: "#fff", aro: "#2f6fd6", check: "#27a85a" })}</div>
<h1>Agenda Personal</h1><div class="sub">Tu tiempo, tus planes</div>
<svg class="trazo" style="left:304px;top:276px" width="200" height="30" viewBox="0 0 200 30"><path d="M4 22 C50 6 120 4 196 14" stroke="#2f6fd6" stroke-width="7" fill="none" stroke-linecap="round"/></svg>
<div class="manuscrito" style="left:905px;top:70px;font-size:56px;color:#1f4fa8;transform:rotate(-8deg)">Organiza<br>Disfruta<br>Avanza</div>
<svg class="trazo" style="left:915px;top:250px" width="220" height="40" viewBox="0 0 240 40"><path d="M6 30 C70 8 150 8 232 12" stroke="#1f4fa8" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;

const informalOscuro = `<style>${base}
body{background:linear-gradient(115deg,#13264a 0%,#0e1d3c 55%,#0a1630 100%)}
body::before{content:"";position:absolute;inset:14px;border:2px solid rgba(120,160,230,.22);border-radius:26px}
.icono{position:absolute;left:70px;top:105px}
h1{position:absolute;left:300px;top:112px;font-weight:800;font-size:72px;color:#fff;letter-spacing:-1px;white-space:nowrap}
.sub{position:absolute;left:304px;top:212px;font-weight:700;font-size:34px;color:#9fb7e0}
</style>
<div class="icono">${calendario({ marco: "#dfe9f8", relleno: "#f4f8ff", aro: "#dfe9f8", check: "#3d6fcf", tapa: "#ef4a5a" })}</div>
<h1>Agenda Personal</h1><div class="sub">Organiza · Disfruta · Avanza</div>
<svg class="trazo" style="left:304px;top:272px" width="220" height="30" viewBox="0 0 220 30"><path d="M4 22 C60 6 140 4 214 14" stroke="#3d9bff" stroke-width="7" fill="none" stroke-linecap="round"/></svg>
<div class="manuscrito" style="left:900px;top:112px;font-size:70px;color:#46a0ff;transform:rotate(-7deg)">Tu tiempo,<br>tus planes</div>
<svg class="trazo" style="left:915px;top:262px" width="280" height="40" viewBox="0 0 300 40"><path d="M6 30 C90 8 190 8 290 12" stroke="#46a0ff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;

const formalClaro = `<style>${base}
body{background:#fff;font-family:'Nunito',sans-serif}
body::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,#ffffff,#f4f7fb)}
h1{position:absolute;left:290px;top:128px;font-family:'Playfair',serif;font-weight:700;font-size:70px;color:#0b1f4a;letter-spacing:-0.5px;white-space:nowrap}
.sub{position:absolute;left:294px;top:236px;font-weight:700;font-size:25px;color:#5d6b86;letter-spacing:7px}
</style>${escritorio(false)}
<div style="position:absolute;left:60px;top:96px">${calendario({ marco: "#0b1f4a", relleno: "#fff", aro: "#0b1f4a", check: "#0b1f4a", grosor: 10 })}</div>
<svg class="trazo" style="left:62px;top:306px" width="190" height="14"><rect width="190" height="7" rx="3.5" fill="#2f6fd6"/></svg>
<h1>Agenda Personal</h1><div class="sub">TU TIEMPO, TUS PLANES</div>
<div class="manuscrito" style="left:985px;top:48px;font-size:50px;color:#fff;transform:rotate(-7deg)">Organiza<br>Disfruta<br>Avanza</div>
<svg class="trazo" style="left:995px;top:206px" width="200" height="34" viewBox="0 0 220 34"><path d="M6 26 C60 8 140 8 212 12" stroke="#4aa3ff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;

const formalOscuro = `<style>${base}
body{background:linear-gradient(120deg,#0e2142 0%,#0a1832 60%,#071127 100%)}
body::after{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:linear-gradient(90deg,#2f8bff,rgba(47,139,255,0))}
h1{position:absolute;left:290px;top:128px;font-family:'Playfair',serif;font-weight:700;font-size:70px;color:#fff;letter-spacing:-0.5px;white-space:nowrap}
.sub{position:absolute;left:294px;top:236px;font-weight:700;font-size:25px;color:#7f9bc8;letter-spacing:7px}
.cuadro{position:absolute;left:58px;top:92px;width:200px;height:200px;border-radius:44px;background:linear-gradient(145deg,#2a7bf0,#1243a8);box-shadow:0 12px 34px rgba(20,80,200,.45)}
.cuadro svg{position:absolute;left:5px;top:6px}
</style>${escritorio(true)}
<div class="cuadro">${calendario({ marco: "#fff", relleno: "rgba(255,255,255,.12)", aro: "#fff", check: "#fff", grosor: 9 })}</div>
<svg class="trazo" style="left:62px;top:312px" width="190" height="14"><rect width="190" height="7" rx="3.5" fill="#2f8bff"/></svg>
<h1>Agenda Personal</h1><div class="sub">TU TIEMPO, TUS PLANES</div>
<div class="manuscrito" style="left:985px;top:48px;font-size:50px;color:#7db8ff;transform:rotate(-7deg)">Organiza<br>Disfruta<br>Avanza</div>
<svg class="trazo" style="left:995px;top:206px" width="200" height="34" viewBox="0 0 220 34"><path d="M6 26 C60 8 140 8 212 12" stroke="#4aa3ff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;

const VARIANTES = { "informal-claro": informalClaro, "informal-oscuro": informalOscuro, "formal-claro": formalClaro, "formal-oscuro": formalOscuro };

const ruta = process.env.CHROMIUM ?? (() => {
  const dir = "/opt/pw-browsers";
  const d = existsSync(dir) ? readdirSync(dir).find((x) => /^chromium-\d+$/.test(x)) : null;
  return d ? join(dir, d, "chrome-linux", "chrome") : undefined;
})();
const nav = await chromium.launch({ executablePath: ruta, args: ["--no-sandbox"] });
const pagina = await nav.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
for (const [nombre, html] of Object.entries(VARIANTES)) {
  await pagina.setContent(`<!doctype html><meta charset="utf-8">${html}`);
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: join(salida, `menu-${nombre}.png`), type: "png" });
  console.log("generado", `menu-${nombre}.png`);
}
await nav.close();
