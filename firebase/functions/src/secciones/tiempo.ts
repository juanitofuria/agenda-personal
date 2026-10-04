import { esc } from "../canal";
import { fechaIso, formatearFechaHora, localAUtc, partesEnZona } from "../fechas";
import { edadDias, faseDelDia, iluminacion, proximoDia } from "../luna";
import { cabecera, cacheado, conReintentos, grados, num0, num1, sparkline } from "../util";
import { Contenido, Contexto, NAV_MENU } from "./tipos";

export interface HoraTiempo {
  fecha: string; hora: number; temp: number; codigo: number; prob: number; mm: number; viento: number;
  humedad: number; uv: number; racha: number; dir: number;
}
export interface DatosTiempo {
  tMin: number; tMax: number; codigo: number; horas: HoraTiempo[];
  amanece: string; anochece: string; uvMax: number; radiacion: number; vientoMax: number; rachaMax: number; dir: number;
  lluviaAyer?: number; lluviaAnio?: number; anio: number;
}
export interface TramoLluvia { desde: number; hasta: number; mm: number; probMax: number }

export const emojiTiempo = (c: number) =>
  c === 0 ? "☀️" : c <= 2 ? "🌤" : c === 3 ? "☁️" : c === 45 || c === 48 ? "🌫" : c >= 51 && c <= 57 ? "🌦" : c >= 61 && c <= 67 ? "🌧"
    : c >= 71 && c <= 77 ? "❄️" : c >= 80 && c <= 82 ? "🌧" : c === 85 || c === 86 ? "🌨" : c >= 95 ? "⛈" : "🌡";
export const descTiempo = (c: number) =>
  c === 0 ? "despejado" : c === 1 ? "poco nuboso" : c === 2 ? "parcialmente nuboso" : c === 3 ? "cubierto" : c === 45 || c === 48 ? "niebla"
    : c >= 51 && c <= 57 ? "llovizna" : c >= 61 && c <= 65 ? "lluvia" : c === 66 || c === 67 ? "lluvia helada" : c >= 71 && c <= 77 ? "nieve"
      : c >= 80 && c <= 82 ? "chubascos" : c === 85 || c === 86 ? "chubascos de nieve" : c === 95 ? "tormenta" : c >= 96 ? "tormenta con granizo" : "variable";
export const brujula = (deg: number) => ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.floor((((deg % 360) + 360) % 360) / 45 + 0.5) % 8];

export function nivelUv(uv: number): string {
  return uv < 3 ? "bajo" : uv < 6 ? "moderado" : uv < 8 ? "alto" : uv < 11 ? "muy alto" : "extremo";
}

/** Tramos de horas seguidas con ≥0,1 mm o probabilidad ≥60 %. */
export function tramosLluvia(horas: HoraTiempo[]): TramoLluvia[] {
  const tramos: TramoLluvia[] = [];
  let ini = -1;
  const cerrar = (fin: number) => {
    if (ini < 0) return;
    const t = horas.slice(ini, fin);
    tramos.push({ desde: t[0].hora, hasta: (t[t.length - 1].hora + 1) % 24, mm: t.reduce((a, h) => a + h.mm, 0), probMax: Math.max(...t.map((h) => h.prob)) });
    ini = -1;
  };
  horas.forEach((h, i) => { if (h.mm >= 0.1 || h.prob >= 60) { if (ini < 0) ini = i; } else cerrar(i); });
  cerrar(horas.length);
  return tramos;
}

const hh = (n: number) => String(n).padStart(2, "0");
export const textoTramo = (t: TramoLluvia) =>
  `${hh(t.desde)}–${hh(t.hasta)} h · ${t.mm >= 0.1 ? `~${num1(t.mm)} l/m²` : "sin acumulación notable"} · prob. ${t.probMax} %`;

/** Convierte la respuesta de Open-Meteo (forecast, 2 días, en la zona del usuario) en datos propios. */
export function parsearPrevision(json: any, ahora: Date, zona: string): DatosTiempo {
  const d = json.daily, h = json.hourly;
  const p = partesEnZona(ahora, zona);
  const ahoraLocal = `${fechaIso(ahora, zona)}T${hh(p.h)}:00`;
  const idx = (h.time as string[]).map((t, i) => [t, i] as const).filter(([t]) => t >= ahoraLocal).slice(0, 18).map(([, i]) => i);
  const horas: HoraTiempo[] = idx.map((i) => ({
    fecha: (h.time[i] as string).slice(0, 10), hora: +(h.time[i] as string).slice(11, 13), temp: h.temperature_2m[i], codigo: h.weather_code[i] ?? 0,
    prob: h.precipitation_probability?.[i] ?? 0, mm: h.precipitation?.[i] ?? 0, viento: h.wind_speed_10m?.[i] ?? 0,
    humedad: h.relative_humidity_2m?.[i] ?? 0, uv: h.uv_index?.[i] ?? 0, racha: h.wind_gusts_10m?.[i] ?? 0, dir: h.wind_direction_10m?.[i] ?? 0,
  }));
  const reloj = (s: string | undefined) => (s ?? "").slice(11, 16);
  return {
    tMin: d.temperature_2m_min[0], tMax: d.temperature_2m_max[0], codigo: d.weather_code[0] ?? 0, horas,
    amanece: reloj(d.sunrise?.[0]), anochece: reloj(d.sunset?.[0]), uvMax: d.uv_index_max?.[0] ?? 0, radiacion: d.shortwave_radiation_sum?.[0] ?? 0,
    vientoMax: d.wind_speed_10m_max?.[0] ?? 0, rachaMax: d.wind_gusts_10m_max?.[0] ?? 0, dir: d.wind_direction_10m_dominant?.[0] ?? 0, anio: p.y,
  };
}

const minutos = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

function bloqueSol(d: DatosTiempo): string {
  if (!d.amanece || !d.anochece) return "";
  const luz = minutos(d.anochece) - minutos(d.amanece);
  return `🌅 <b>Sol</b>\nAmanece ${d.amanece} · Anochece ${d.anochece}\n${Math.floor(luz / 60)} h ${luz % 60} min de luz`;
}

/** Mensaje del tiempo: bloques separados por una línea en blanco, cada uno con su título, para entenderlo de un vistazo. */
export function renderTiempo(d: DatosTiempo, ciudad: string, zona: string, ahora: Date): string {
  const p = partesEnZona(ahora, zona);
  const temps = d.horas.map((h) => h.temp);
  const primera = d.horas[0], ultima = d.horas[d.horas.length - 1];
  const bloques: string[] = [
    cabecera(emojiTiempo(d.codigo), `Tiempo · ${esc(ciudad)}`, `${descTiempo(d.codigo).replace(/^./, (c) => c.toUpperCase())} · mín ${grados(d.tMin)} / máx ${grados(d.tMax)}`),
  ];
  if (temps.length >= 2) {
    const iMax = temps.indexOf(Math.max(...temps)), iMin = temps.indexOf(Math.min(...temps));
    bloques.push(`🌡 <b>Temperatura</b> · ${hh(primera.hora)} → ${hh(ultima.hora)} h\n<code>${sparkline(temps)}</code>\n🔺 Máx ${grados(temps[iMax])} a las ${hh(d.horas[iMax].hora)} h\n🔻 Mín ${grados(temps[iMin])} a las ${hh(d.horas[iMin].hora)} h`);
  }
  const tramos = tramosLluvia(d.horas);
  bloques.push(tramos.length === 0
    ? `☀️ <b>Sin lluvia prevista</b>\nEn las próximas ${d.horas.length} h`
    : `🌦 <b>Lluvia prevista</b>\n${tramos.map((t) => `• ${textoTramo(t)}`).join("\n")}`);
  const sol = bloqueSol(d);
  if (sol) bloques.push(sol);
  bloques.push([
    `💨 <b>Viento</b> ${num0(primera?.viento ?? d.vientoMax)} km/h del ${brujula(primera?.dir ?? d.dir)}`,
    `     hoy hasta ${num0(d.vientoMax)} · rachas ${num0(d.rachaMax)} km/h`,
    `💧 <b>Humedad</b> ${primera?.humedad ?? "–"} %`,
    `🕶 <b>UV máx.</b> ${num1(d.uvMax)} (${nivelUv(d.uvMax)})${d.uvMax >= 3 ? " — protección solar" : ""}`,
  ].join("\n"));
  const f = faseDelDia(p.y, p.m, p.d, zona);
  bloques.push(`${f.emoji} <b>${f.nombre}</b>\n${Math.round(iluminacion(p.y, p.m, p.d, zona) * 100)} % iluminada`);
  if (d.lluviaAyer !== undefined && d.lluviaAnio !== undefined) {
    bloques.push(`🌧 <b>Lluvia caída</b>\nAyer ${d.lluviaAyer >= 0.1 ? `llovió ${num1(d.lluviaAyer)} l/m²` : "no llovió"}\nAcumulado ${d.anio}: ${num1(d.lluviaAnio)} l/m²`);
  }
  return bloques.join("\n\n");
}

export function renderHoraAHora(d: DatosTiempo, ciudad: string): string {
  const filas = d.horas.map((h) => `${hh(h.hora)}:00 ${emojiTiempo(h.codigo)} <b>${grados(h.temp)}</b> · 💧${h.prob} % · 💨${num0(h.viento)} · 🌫${h.humedad} %`);
  return [cabecera("🕐", `Hora a hora · ${esc(ciudad)}`, "💧 prob. lluvia · 💨 viento km/h · 🌫 humedad"), "", ...filas].join("\n");
}

/** Calendario lunar del mes: fase de hoy, próximas lunas llena y nueva, y las fases día a día por semanas. */
export function renderLuna(ahora: Date, zona: string): string {
  const p = partesEnZona(ahora, zona);
  const hoy = faseDelDia(p.y, p.m, p.d, zona);
  const fmt = (x: { y: number; m: number; d: number }) => formatearFechaHora(localAUtc(x.y, x.m, x.d, 12, 0, zona), zona).split(" · ")[0];
  const llena = proximoDia(p.y, p.m, p.d, true, zona), nueva = proximoDia(p.y, p.m, p.d, false, zona);
  const mes = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: zona }).format(ahora);
  const dias = new Date(Date.UTC(p.y, p.m, 0)).getUTCDate();
  const primerDow = (new Date(Date.UTC(p.y, p.m - 1, 1)).getUTCDay() + 6) % 7; // lunes = 0
  const semanas: string[] = [];
  for (let ini = 1 - primerDow; ini <= dias; ini += 7) {
    const celdas: string[] = [];
    for (let d = Math.max(ini, 1); d <= Math.min(ini + 6, dias); d++) celdas.push(`${d === p.d ? `<b>${d}</b>` : d}${faseDelDia(p.y, p.m, d, zona).emoji}`);
    semanas.push(celdas.join("  "));
  }
  return [
    cabecera("🌙", `Calendario lunar · ${mes}`), "",
    `Hoy: ${hoy.emoji} ${hoy.nombre} · ${Math.round(iluminacion(p.y, p.m, p.d, zona) * 100)} % iluminada · ${Math.round(edadDias(p.y, p.m, p.d, zona))} días`,
    `🌕 Próxima llena: ${fmt(llena)}`, `🌑 Próxima nueva: ${fmt(nueva)}`, "", "<i>Por semanas (lunes a domingo):</i>", ...semanas,
  ].join("\n");
}

async function pedirPrevision(ctx: Contexto): Promise<DatosTiempo> {
  const { usuario: u, ahora } = ctx;
  const c = u.ciudad!;
  const clave = `tiempo:${c.lat.toFixed(2)},${c.lon.toFixed(2)}:${u.zona}:${fechaIso(ahora, u.zona)}T${partesEnZona(ahora, u.zona).h}`;
  return cacheado(ctx.almacen, clave, 45 * 60_000, ahora, async () => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}` +
      "&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,uv_index,wind_gusts_10m,wind_direction_10m" +
      "&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,uv_index_max,shortwave_radiation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant" +
      `&timezone=${encodeURIComponent(u.zona)}&forecast_days=2`;
    const datos = parsearPrevision((await conReintentos(() => ctx.http.get(url, { timeout: 20000 }))).data, ahora, u.zona);
    // Lluvia de ayer y acumulada del año (modelo, sin retraso). Si falla no se pierde el resto.
    try {
      const p = partesEnZona(ahora, u.zona);
      const ayer = new Date(Date.UTC(p.y, p.m - 1, p.d - 1));
      if (ayer.getUTCFullYear() === p.y) {
        const iso = ayer.toISOString().slice(0, 10);
        const h = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&start_date=${p.y}-01-01&end_date=${iso}&daily=precipitation_sum&timezone=${encodeURIComponent(u.zona)}`;
        const arr = ((await conReintentos(() => ctx.http.get(h, { timeout: 20000 }))).data as any).daily.precipitation_sum as (number | null)[];
        const v = arr.map((x) => x ?? 0);
        datos.lluviaAyer = v[v.length - 1] ?? 0;
        datos.lluviaAnio = v.reduce((a, b) => a + b, 0);
      }
    } catch { /* sin datos de lluvia pasada */ }
    return datos;
  });
}

export async function contenidoTiempo(ctx: Contexto): Promise<Contenido> {
  if (!ctx.usuario.ciudad) {
    return { html: "🌤 <b>Tiempo</b>\nPara darte el tiempo necesito saber dónde vives.", teclado: [[{ texto: "📍 Indicar mi ciudad", datos: "p:ciudad" }], NAV_MENU] };
  }
  const d = await pedirPrevision(ctx);
  return {
    html: renderTiempo(d, ctx.usuario.ciudad.nombre, ctx.usuario.zona, ctx.ahora),
    teclado: [[{ texto: "🕐 Hora a hora", datos: "sev:tiempo:horas" }, { texto: "🌙 Calendario lunar", datos: "sev:tiempo:luna" }], NAV_MENU],
  };
}

export async function contenidoHoraAHora(ctx: Contexto): Promise<Contenido> {
  if (!ctx.usuario.ciudad) return contenidoTiempo(ctx);
  const d = await pedirPrevision(ctx);
  return { html: renderHoraAHora(d, ctx.usuario.ciudad.nombre), teclado: [[{ texto: "⬅️ Resumen", datos: "sev:tiempo" }], NAV_MENU] };
}

export async function contenidoLuna(ctx: Contexto): Promise<Contenido> {
  return { html: renderLuna(ctx.ahora, ctx.usuario.zona), teclado: [[{ texto: "⬅️ Resumen del tiempo", datos: "sev:tiempo" }], NAV_MENU] };
}
