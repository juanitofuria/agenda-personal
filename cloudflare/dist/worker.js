var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/almacenD1.ts
var aFecha = /* @__PURE__ */ __name((v) => typeof v === "string" || typeof v === "number" ? new Date(v) : null, "aFecha");
function usuarioDesdeJson(id, d) {
  return {
    id,
    nombre: d.nombre ?? "",
    estilo: d.estilo === "formal" ? "formal" : "informal",
    modo: d.modo === "oscuro" || d.modo === "auto" ? d.modo : "claro",
    nacimiento: d.nacimiento ?? null,
    zona: d.zona ?? "Europe/Madrid",
    ciudad: d.ciudad ?? null,
    avatar: d.avatar && ["emoji", "foto"].includes(d.avatar.tipo) ? d.avatar : null,
    notificaciones: { sonido: ["signature", "crystal", "pulse", "halo", "orbit", "velvet"].includes(d.notificaciones?.sonido) ? d.notificaciones.sonido : "signature", suscripciones: Array.isArray(d.notificaciones?.suscripciones) ? d.notificaciones.suscripciones : [] },
    compra: { items: Array.isArray(d.compra?.items) ? d.compra.items : [], historial: Array.isArray(d.compra?.historial) ? d.compra.historial : [], token: typeof d.compra?.token === "string" ? d.compra.token : null },
    salud: { peso: Array.isArray(d.salud?.peso) ? d.salud.peso : [], entrenamientos: Array.isArray(d.salud?.entrenamientos) ? d.salud.entrenamientos : [], planes: Array.isArray(d.salud?.planes) ? d.salud.planes : [] },
    economia: {
      movimientos: Array.isArray(d.economia?.movimientos) ? d.economia.movimientos.map((x) => ({ id: String(x.id ?? ""), tipo: x.tipo === "ingreso" ? "ingreso" : "gasto", concepto: String(x.concepto ?? "").slice(0, 100), categoria: String(x.categoria ?? "Otros").slice(0, 40), grupo: x.grupo === "fijo" ? "fijo" : x.grupo === "ahorro" ? "ahorro" : x.grupo === "variable" ? "variable" : void 0, importe: Math.max(0, Number(x.importe) || 0), fecha: String(x.fecha ?? "").slice(0, 20), recurrente: !!x.recurrente })).filter((x) => x.id && x.concepto && x.importe > 0) : [],
      facturas: Array.isArray(d.economia?.facturas) ? d.economia.facturas.map((x) => ({ id: String(x.id ?? ""), concepto: String(x.concepto ?? "").slice(0, 100), importe: Math.max(0, Number(x.importe) || 0), vencimiento: String(x.vencimiento ?? "").slice(0, 20), pagada: !!x.pagada })).filter((x) => x.id && x.concepto && x.importe > 0) : [],
      presupuestoMensual: d.economia?.presupuestoMensual === null || d.economia?.presupuestoMensual === void 0 ? null : Number.isFinite(Number(d.economia.presupuestoMensual)) && Number(d.economia.presupuestoMensual) >= 0 ? Number(d.economia.presupuestoMensual) : null,
      ...d.economia?.porcentajes && [d.economia.porcentajes.fijo, d.economia.porcentajes.variable, d.economia.porcentajes.ahorro].every((n) => Number.isFinite(Number(n))) ? { porcentajes: { fijo: Number(d.economia.porcentajes.fijo), variable: Number(d.economia.porcentajes.variable), ahorro: Number(d.economia.porcentajes.ahorro) } } : {},
      ...Array.isArray(d.economia?.historial) ? { historial: d.economia.historial.slice(0, 60) } : {},
      objetivos: Array.isArray(d.economia?.objetivos) ? d.economia.objetivos.map((x) => ({ id: String(x.id ?? ""), titulo: String(x.titulo ?? "").slice(0, 100), importe: Math.max(0, Number(x.importe) || 0), ahorrado: Math.max(0, Number(x.ahorrado) || 0), fechaObjetivo: String(x.fechaObjetivo ?? "").slice(0, 20) })).filter((x) => x.id && x.titulo && x.importe > 0) : []
    },
    secciones: d.secciones ?? {},
    temas: d.temas ?? [],
    creadoEn: aFecha(d.creadoEn) ?? /* @__PURE__ */ new Date(0)
  };
}
__name(usuarioDesdeJson, "usuarioDesdeJson");
function eventoDesdeJson(uid, id, d) {
  return {
    id,
    uid,
    tipo: d.tipo,
    titulo: d.titulo ?? "",
    lugar: d.lugar ?? "",
    fechaHora: aFecha(d.fechaHora),
    antelacionMin: d.antelacionMin ?? 0,
    repeticion: d.repeticion ?? "ninguna",
    avisado: !!d.avisado,
    hecho: !!d.hecho,
    creadoEn: aFecha(d.creadoEn) ?? /* @__PURE__ */ new Date(0),
    ...typeof d.nota === "string" && d.nota ? { nota: d.nota } : {},
    ...Array.isArray(d.subtareas) ? { subtareas: d.subtareas.map((x) => ({ id: String(x.id ?? ""), titulo: String(x.titulo ?? "").slice(0, 120), hecho: !!x.hecho })).filter((x) => x.id && x.titulo) } : {},
    ...d.mensaje && typeof d.mensaje.texto === "string" ? { mensaje: { para: String(d.mensaje.para ?? ""), telefono: String(d.mensaje.telefono ?? ""), texto: d.mensaje.texto } } : {}
  };
}
__name(eventoDesdeJson, "eventoDesdeJson");
function programacionDesdeFila(f) {
  const d = JSON.parse(f.datos);
  return { id: f.id, uid: f.uid, tipo: f.tipo, ref: d.ref, proximo: new Date(f.proximo), posponer: d.posponer, intentos: d.intentos };
}
__name(programacionDesdeFila, "programacionDesdeFila");
var nuevoId = /* @__PURE__ */ __name(() => crypto.randomUUID().replace(/-/g, "").slice(0, 12), "nuevoId");
var AlmacenD1 = class {
  constructor(db) {
    this.db = db;
  }
  db;
  static {
    __name(this, "AlmacenD1");
  }
  async getUsuario(id) {
    const f = await this.db.prepare("SELECT datos FROM usuarios WHERE id = ?").bind(id).first();
    return f ? usuarioDesdeJson(id, JSON.parse(f.datos)) : null;
  }
  async guardarUsuario(u) {
    const { id, ...resto } = u;
    await this.db.prepare("INSERT INTO usuarios (id, datos) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET datos = excluded.datos").bind(id, JSON.stringify(resto)).run();
  }
  async borrarUsuario(id) {
    await this.db.batch([
      this.db.prepare("DELETE FROM eventos WHERE uid = ?").bind(id),
      this.db.prepare("DELETE FROM programaciones WHERE uid = ?").bind(id),
      this.db.prepare("DELETE FROM usuarios WHERE id = ?").bind(id)
    ]);
  }
  async listarEventos(uid) {
    const r = await this.db.prepare("SELECT id, datos FROM eventos WHERE uid = ?").bind(uid).all();
    return r.results.map((f) => eventoDesdeJson(uid, f.id, JSON.parse(f.datos)));
  }
  async getEvento(uid, id) {
    const f = await this.db.prepare("SELECT datos FROM eventos WHERE uid = ? AND id = ?").bind(uid, id).first();
    return f ? eventoDesdeJson(uid, id, JSON.parse(f.datos)) : null;
  }
  async guardarEvento(e) {
    const guardado = { ...e, id: e.id ?? nuevoId() };
    const { id, uid, ...datos } = guardado;
    await this.db.prepare("INSERT INTO eventos (uid, id, datos) VALUES (?, ?, ?) ON CONFLICT(uid, id) DO UPDATE SET datos = excluded.datos").bind(uid, id, JSON.stringify(datos)).run();
    return guardado;
  }
  async borrarEvento(uid, id) {
    await this.db.prepare("DELETE FROM eventos WHERE uid = ? AND id = ?").bind(uid, id).run();
  }
  async guardarProgramacion(p) {
    const datos = JSON.stringify({ ref: p.ref, posponer: p.posponer, intentos: p.intentos });
    await this.db.prepare("INSERT INTO programaciones (id, uid, tipo, proximo, datos) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET uid = excluded.uid, tipo = excluded.tipo, proximo = excluded.proximo, datos = excluded.datos").bind(p.id, p.uid, p.tipo, p.proximo.getTime(), datos).run();
  }
  async borrarProgramacion(id) {
    await this.db.prepare("DELETE FROM programaciones WHERE id = ?").bind(id).run();
  }
  async borrarProgramacionesDe(uid, tipo) {
    if (tipo) await this.db.prepare("DELETE FROM programaciones WHERE uid = ? AND tipo = ?").bind(uid, tipo).run();
    else await this.db.prepare("DELETE FROM programaciones WHERE uid = ?").bind(uid).run();
  }
  async programacionesVencidas(hasta, limite) {
    const r = await this.db.prepare("SELECT id, uid, tipo, proximo, datos FROM programaciones WHERE proximo <= ? ORDER BY proximo LIMIT ?").bind(hasta.getTime(), limite).all();
    return r.results.map(programacionDesdeFila);
  }
  /** Atómico: un único UPDATE condicionado al valor anterior. */
  async reclamarProgramacion(id, esperado, nuevo) {
    const r = await this.db.prepare("UPDATE programaciones SET proximo = ? WHERE id = ? AND proximo = ?").bind(nuevo.getTime(), id, esperado.getTime()).run();
    return (r.meta?.changes ?? 0) === 1;
  }
  async getHoroscopo(signoId) {
    const f = await this.db.prepare("SELECT datos FROM horoscopos WHERE signo = ?").bind(signoId).first();
    return f ? JSON.parse(f.datos) : null;
  }
  async guardarHoroscopo(signoId, doc) {
    await this.db.prepare("INSERT INTO horoscopos (signo, datos) VALUES (?, ?) ON CONFLICT(signo) DO UPDATE SET datos = excluded.datos").bind(signoId, JSON.stringify(doc)).run();
  }
  async cacheGet(clave, ahora) {
    const f = await this.db.prepare("SELECT valor FROM cache WHERE clave = ? AND expira > ?").bind(clave, ahora.getTime()).first();
    return f?.valor ?? null;
  }
  async cacheGetVarios(claves, ahora) {
    const r = {};
    if (!claves.length) return r;
    const f = await this.db.prepare(`SELECT clave, valor FROM cache WHERE expira > ? AND clave IN (${claves.map(() => "?").join(",")})`).bind(ahora.getTime(), ...claves).all();
    for (const x of f.results) r[x.clave] = x.valor;
    return r;
  }
  async cacheSet(clave, valor, ttlMs, ahora) {
    await this.db.prepare("INSERT INTO cache (clave, valor, expira) VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, expira = excluded.expira").bind(clave, valor, ahora.getTime() + ttlMs).run();
  }
  /** Borra la caché caducada (se llama de vez en cuando para que no crezca). */
  async limpiarCache(ahora) {
    await this.db.prepare("DELETE FROM cache WHERE expira <= ?").bind(ahora.getTime()).run();
  }
};

// src/http.ts
var ErrorHttp = class extends Error {
  constructor(mensaje, response) {
    super(mensaje);
    this.response = response;
  }
  response;
  static {
    __name(this, "ErrorHttp");
  }
};
var HttpFetch = class {
  constructor(maxPeticiones = 45, maxConcurrentes = 5, fetcher = (...a) => fetch(...a)) {
    this.maxPeticiones = maxPeticiones;
    this.maxConcurrentes = maxConcurrentes;
    this.fetcher = fetcher;
  }
  maxPeticiones;
  maxConcurrentes;
  fetcher;
  static {
    __name(this, "HttpFetch");
  }
  usadas = 0;
  activas = 0;
  cola = [];
  get restantes() {
    return this.maxPeticiones - this.usadas;
  }
  async turno() {
    if (this.activas >= this.maxConcurrentes) await new Promise((r) => this.cola.push(r));
    this.activas++;
  }
  liberar() {
    this.activas--;
    this.cola.shift()?.();
  }
  async pedir(url, init, timeout = 2e4, maxBytes) {
    if (this.usadas >= this.maxPeticiones) throw new ErrorHttp("presupuesto de peticiones salientes agotado en esta ejecuci\xF3n");
    this.usadas++;
    await this.turno();
    try {
      let r;
      try {
        r = await this.fetcher(url, { ...init, signal: AbortSignal.timeout(timeout) });
      } catch (e) {
        throw new ErrorHttp(e.message || "error de red");
      }
      const texto = maxBytes ? await leerInicio(r, maxBytes) : await r.text();
      let data = texto;
      if ((r.headers.get("content-type") ?? "").includes("json") || /^\s*[[{]/.test(texto)) {
        try {
          data = JSON.parse(texto);
        } catch {
        }
      }
      if (!r.ok) throw new ErrorHttp(`HTTP ${r.status}`, { status: r.status, data });
      return { data };
    } finally {
      this.liberar();
    }
  }
  get(url, opciones) {
    return this.pedir(url, { method: "GET", headers: opciones?.headers }, opciones?.timeout, opciones?.maxBytes);
  }
  post(url, cuerpo, opciones) {
    return this.pedir(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo ?? {}) }, opciones?.timeout);
  }
};
async function leerInicio(r, maxBytes) {
  if (!r.body) return (await r.text()).slice(0, maxBytes);
  const lector = r.body.getReader();
  const trozos = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await lector.read();
    if (done || !value) break;
    trozos.push(value);
    total += value.byteLength;
  }
  await lector.cancel().catch(() => void 0);
  const todo = new Uint8Array(total);
  let pos = 0;
  for (const t of trozos) {
    todo.set(t, pos);
    pos += t.byteLength;
  }
  return new TextDecoder().decode(todo);
}
__name(leerInicio, "leerInicio");

// ../firebase/functions/src/horoscopo20min.ts
var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
var MIN_TEXTO = 50;
var urlSigno20min = /* @__PURE__ */ __name((signo) => `https://www.20minutos.es/horoscopo/${signo.id}/`, "urlSigno20min");
var ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function limpiar(html) {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      try {
        return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      } catch {
        return m;
      }
    }
    return ENTIDADES[e.toLowerCase()] ?? m;
  }).replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}
__name(limpiar, "limpiar");
function leerPagina20min(html) {
  const bloques = [...html.matchAll(/class="[^"]*\bprediction\b[^"]*"/g)];
  if (bloques.length < 2) return [];
  const resto = html.slice(bloques[1].index);
  const entradas = [];
  for (const m of resto.matchAll(/<p[^>]*class="[^"]*\bdate\b[^"]*"[^>]*>([\s\S]*?)<\/p>\s*<div[^>]*>([\s\S]*?)<\/div>/g)) {
    const f = /(\d{1,2})\s+([a-záéíóú]+)\s+de\s+(\d{4})/i.exec(limpiar(m[1]));
    const mes = f ? MESES.indexOf(f[2].toLowerCase()) : -1;
    if (!f || mes < 0) continue;
    const texto = limpiar(m[2]);
    if (texto.length < MIN_TEXTO) continue;
    entradas.push({ fecha: `${f[3]}-${String(mes + 1).padStart(2, "0")}-${f[1].padStart(2, "0")}`, texto });
  }
  return entradas;
}
__name(leerPagina20min, "leerPagina20min");
async function obtenerSigno20min(http, signo, fecha) {
  const url = urlSigno20min(signo);
  let html;
  try {
    html = (await http.get(url, {
      timeout: 8e3,
      headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept-Language": "es-ES,es;q=0.9", Accept: "text/html" }
    })).data;
  } catch (e) {
    const estado2 = e.response?.status;
    throw new ErrorApi(estado2 ? `20minutos: HTTP ${estado2}` : `20minutos: ${e.message}`, estado2);
  }
  if (typeof html !== "string") throw new ErrorApi("20minutos: respuesta no v\xE1lida", 502, "PARSE");
  const entradas = leerPagina20min(html);
  if (entradas.length === 0) throw new ErrorApi("20minutos: no he encontrado el hor\xF3scopo en la p\xE1gina", 502, "PARSE");
  const elegida = entradas.find((e) => e.fecha === fecha) ?? entradas.reduce((a, b) => b.fecha > a.fecha ? b : a);
  return { sign: signo.ingles, date: elegida.fecha, language: "es", text: elegida.texto, source: url, cached: false };
}
__name(obtenerSigno20min, "obtenerSigno20min");

// ../firebase/functions/src/horoscopo.ts
var SIGNOS = [
  { id: "aries", ingles: "aries", nombre: "Aries" },
  { id: "tauro", ingles: "taurus", nombre: "Tauro" },
  { id: "geminis", ingles: "gemini", nombre: "G\xE9minis" },
  { id: "cancer", ingles: "cancer", nombre: "C\xE1ncer" },
  { id: "leo", ingles: "leo", nombre: "Leo" },
  { id: "virgo", ingles: "virgo", nombre: "Virgo" },
  { id: "libra", ingles: "libra", nombre: "Libra" },
  { id: "escorpio", ingles: "scorpio", nombre: "Escorpio" },
  { id: "sagitario", ingles: "sagittarius", nombre: "Sagitario" },
  { id: "capricornio", ingles: "capricorn", nombre: "Capricornio" },
  { id: "acuario", ingles: "aquarius", nombre: "Acuario" },
  { id: "piscis", ingles: "pisces", nombre: "Piscis" }
];
var ErrorApi = class extends Error {
  constructor(mensaje, estado2, codigo) {
    super(mensaje);
    this.estado = estado2;
    this.codigo = codigo;
  }
  estado;
  codigo;
  static {
    __name(this, "ErrorApi");
  }
  /** Transitorio = merece la pena reintentar (red, timeout, 5xx). VALIDATION y NOT_FOUND son errores nuestros. */
  get transitorio() {
    return this.estado === void 0 || this.estado >= 500;
  }
};
function comoErrorApi(e) {
  if (e instanceof ErrorApi) return e;
  const r = e.response;
  const base = e.message ?? String(e);
  if (!r) return new ErrorApi(base);
  const codigo = r.data?.error;
  return new ErrorApi(`HTTP ${r.status}${codigo ? ` ${codigo}` : ""}: ${r.data?.message ?? base}`, r.status, codigo);
}
__name(comoErrorApi, "comoErrorApi");
var FORMATOS_FECHA = /* @__PURE__ */ new Map();
function fechaEnZona(fecha, zona) {
  let f = FORMATOS_FECHA.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" });
    FORMATOS_FECHA.set(zona, f);
  }
  return f.format(fecha);
}
__name(fechaEnZona, "fechaEnZona");
function nombreFuente(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
__name(nombreFuente, "nombreFuente");
function urlSegura(url) {
  if (typeof url !== "string") return "";
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}
__name(urlSegura, "urlSegura");
async function reintentar(fn, intentos, esperaMs) {
  let ultimo;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimo = comoErrorApi(e);
      if (!ultimo.transitorio) throw ultimo;
      if (i < intentos - 1 && esperaMs > 0) await new Promise((r) => setTimeout(r, esperaMs * (i + 1)));
    }
  }
  throw ultimo ?? new ErrorApi("sin intentos");
}
__name(reintentar, "reintentar");
function urlHoroscopo(cfg, signo, fecha) {
  return `${cfg.baseUrl.replace(/\/+$/, "")}/horoscope/${encodeURIComponent(cfg.idioma)}/${signo.ingles}/${fecha}`;
}
__name(urlHoroscopo, "urlHoroscopo");
async function obtenerSigno(http, cfg, signo, fecha, intentos = 3, esperaMs = 2e3) {
  const r = await reintentar(() => http.get(urlHoroscopo(cfg, signo, fecha), { timeout: 3e4 }), intentos, esperaMs);
  const d = r.data;
  if (typeof d !== "object" || d === null) throw new ErrorApi(`respuesta no v\xE1lida de la API para ${signo.id}`, 502, "PARSE");
  return d;
}
__name(obtenerSigno, "obtenerSigno");
async function obtenerHoroscopo(http, cfg, signo, fecha, intentos = 3, esperaMs = 2e3) {
  if (!cfg.directo || cfg.idioma !== "es") return obtenerSigno(http, cfg, signo, fecha, intentos, esperaMs);
  try {
    return await obtenerSigno20min(http, signo, fecha);
  } catch (e1) {
    try {
      return await obtenerSigno(http, cfg, signo, fecha, Math.min(intentos, 2), esperaMs);
    } catch (e2) {
      throw new ErrorApi(`${comoErrorApi(e1).message}; horoscopefree: ${comoErrorApi(e2).message}`, comoErrorApi(e1).estado);
    }
  }
}
__name(obtenerHoroscopo, "obtenerHoroscopo");
function construirDoc(signo, fechaPedida, d, cfg, ahora = /* @__PURE__ */ new Date()) {
  const texto = (d.text ?? "").trim();
  if (!texto) return null;
  const fuenteUrl = urlSegura(d.source);
  return {
    signo: signo.id,
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(d.date ?? "") ? d.date : fechaPedida,
    prediccion: texto,
    idioma: d.language || cfg.idioma,
    fuente: fuenteUrl ? nombreFuente(fuenteUrl) : "",
    fuenteUrl,
    actualizadoEn: ahora.toISOString()
  };
}
__name(construirDoc, "construirDoc");
async function actualizarTodos(dep) {
  const log = dep.log ?? (() => void 0);
  const hoy = fechaEnZona(dep.ahora, dep.zona);
  const res = { actualizados: [], alDia: [], omitidos: [], fallidos: [] };
  log(`Actualizando hor\xF3scopo para ${hoy}`);
  let pedidos = 0;
  for (const signo of SIGNOS) {
    try {
      const previa = await dep.fechaGuardada?.(signo.id);
      if (previa === hoy) {
        res.alDia.push(signo.id);
        continue;
      }
      if (dep.maxPedidos !== void 0 && pedidos >= dep.maxPedidos) continue;
      pedidos++;
      const respuesta = await obtenerHoroscopo(dep.http, dep.config, signo, hoy, dep.intentos ?? 3, dep.esperaMs ?? 2e3);
      const doc = construirDoc(signo, hoy, respuesta, dep.config, dep.ahora);
      if (!doc) {
        res.fallidos.push(signo.id);
        log(`\u2717 ${signo.id}: la API no devolvi\xF3 texto`);
        continue;
      }
      if (previa && previa > doc.fecha) {
        res.omitidos.push(signo.id);
        log(`= ${signo.id}: ya hay uno m\xE1s reciente (${previa})`);
        continue;
      }
      await dep.guardar(signo.id, doc);
      res.actualizados.push(signo.id);
      log(`\u2713 ${signo.id} (${doc.fecha}, ${doc.fuente})`);
    } catch (e) {
      res.fallidos.push(signo.id);
      log(`\u2717 ${signo.id}: ${comoErrorApi(e).message}`);
    }
  }
  return res;
}
__name(actualizarTodos, "actualizarTodos");

// ../firebase/functions/src/modelo.ts
var SECCIONES = {
  tiempo: { emoji: "\u{1F324}", titulo: "Tiempo", horaDefecto: "07:00", descripcion: "Previsi\xF3n por horas, lluvia, sol, viento, UV y luna" },
  noticias: { emoji: "\u{1F4F0}", titulo: "Noticias", horaDefecto: "07:10", descripcion: "Econom\xEDa, pol\xEDtica y noticias de tu zona" },
  agenda: { emoji: "\u{1F5D3}", titulo: "Agenda", horaDefecto: "07:20", descripcion: "Tus citas y tareas de hoy y ma\xF1ana" },
  horoscopo: { emoji: "\u{1F52E}", titulo: "Hor\xF3scopo", horaDefecto: "08:00", descripcion: "El hor\xF3scopo del d\xEDa de tu signo" },
  mercados: { emoji: "\u{1F4C8}", titulo: "Mercados", horaDefecto: "14:00", descripcion: "Premercado de Wall Street y cierre de ayer" }
};
var ORDEN_SECCIONES = ["tiempo", "noticias", "agenda", "horoscopo", "mercados"];
function momentoAviso(e) {
  return e.fechaHora ? new Date(e.fechaHora.getTime() - e.antelacionMin * 6e4) : null;
}
__name(momentoAviso, "momentoAviso");
function usuarioNuevo(id, nombre, ahora) {
  const secciones = {};
  for (const s of ORDEN_SECCIONES) secciones[s] = { activa: false, hora: SECCIONES[s].horaDefecto };
  return {
    id,
    nombre,
    estilo: "informal",
    modo: "claro",
    nacimiento: null,
    zona: "Europe/Madrid",
    ciudad: null,
    compra: { items: [], historial: [], token: null },
    economia: { movimientos: [], facturas: [], presupuestoMensual: null, objetivos: [] },
    salud: { peso: [], entrenamientos: [], planes: [] },
    avatar: null,
    notificaciones: { sonido: "signature", suscripciones: [] },
    secciones,
    temas: [],
    creadoEn: ahora
  };
}
__name(usuarioNuevo, "usuarioNuevo");

// ../firebase/functions/src/util.ts
var NF1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
var NF0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
var num1 = /* @__PURE__ */ __name((v) => NF1.format(v), "num1");
var num0 = /* @__PURE__ */ __name((v) => NF0.format(v), "num0");
var grados = /* @__PURE__ */ __name((v) => `${Math.round(v)}\xBA`, "grados");
var NF2 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
var pct = /* @__PURE__ */ __name((v) => `${v >= 0 ? "+" : "\u2212"}${NF2.format(Math.abs(v))} %`, "pct");
var BARRAS = "\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588";
function sparkline(valores) {
  if (valores.length === 0) return "";
  const min = Math.min(...valores), max = Math.max(...valores);
  if (max === min) return BARRAS[3].repeat(valores.length);
  return valores.map((v) => BARRAS[Math.min(7, Math.floor((v - min) / (max - min) * 8))]).join("");
}
__name(sparkline, "sparkline");
var sinTildes = /* @__PURE__ */ __name((s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim(), "sinTildes");
var slug = /* @__PURE__ */ __name((t) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tema", "slug");
var SEPARADOR = "\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC";
var cabecera = /* @__PURE__ */ __name((emoji, titulo, subtitulo) => `${emoji} <b>${titulo}</b>${subtitulo ? `
<i>${subtitulo}</i>` : ""}
${SEPARADOR}`, "cabecera");
async function cacheado(almacen, clave, ttlMs, ahora, fn) {
  const previo = await almacen.cacheGet(clave, ahora).catch(() => null);
  if (previo) {
    try {
      return JSON.parse(previo);
    } catch {
    }
  }
  const valor = await fn();
  await almacen.cacheSet(clave, JSON.stringify(valor), ttlMs, ahora).catch(() => void 0);
  return valor;
}
__name(cacheado, "cacheado");
function conPlazo(p, ms, mensaje = "tard\xF3 demasiado en responder") {
  let t;
  const plazo = new Promise((_, rechazar) => {
    t = setTimeout(() => rechazar(new Error(mensaje)), ms);
  });
  return Promise.race([p, plazo]).finally(() => clearTimeout(t));
}
__name(conPlazo, "conPlazo");
async function conReintentos(fn, intentos = 3, esperaMs = 1e3) {
  let ultimo;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimo = e;
      if (i < intentos - 1 && esperaMs > 0) await new Promise((r) => setTimeout(r, esperaMs * (i + 1)));
    }
  }
  throw ultimo;
}
__name(conReintentos, "conReintentos");

// ../firebase/functions/src/podcast.ts
var ENTIDADES2 = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
var decodificar = /* @__PURE__ */ __name((s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === "#") {
    try {
      return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    } catch {
      return m;
    }
  }
  return ENTIDADES2[e.toLowerCase()] ?? m;
}), "decodificar");
var sinHtml = /* @__PURE__ */ __name((s) => decodificar(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), "sinHtml");
function etiqueta(bloque, nombre) {
  const m = new RegExp(`<${nombre}(?:\\s[^>]*)?>([\\s\\S]*?)</${nombre}>`, "i").exec(bloque);
  return m ? m[1] : "";
}
__name(etiqueta, "etiqueta");
function leerEpisodios(xml, max = 1) {
  const res = [];
  let pos = 0;
  while (res.length < max) {
    const ini = xml.indexOf("<item", pos);
    if (ini < 0) break;
    const fin = xml.indexOf("</item>", ini);
    if (fin < 0) break;
    pos = fin + 7;
    const it = xml.slice(ini, fin);
    const enc2 = /<enclosure\b([^>]*)>/i.exec(it)?.[1] ?? "";
    const atributo = /* @__PURE__ */ __name((n) => new RegExp(`${n}="([^"]*)"`, "i").exec(enc2)?.[1] ?? "", "atributo");
    const notas = ["content:encoded", "itunes:summary", "description"].map((n) => sinHtml(etiqueta(it, n))).sort((a, b) => b.length - a.length)[0] ?? "";
    res.push({
      titulo: sinHtml(etiqueta(it, "title")),
      fecha: sinHtml(etiqueta(it, "pubDate")),
      notas,
      enlace: sinHtml(etiqueta(it, "link")),
      audioUrl: decodificar(atributo("url")),
      audioBytes: Number(atributo("length")) || 0,
      audioTipo: atributo("type")
    });
  }
  return res;
}
__name(leerEpisodios, "leerEpisodios");
var FEED_PODCAST = "https://feeds.megaphone.fm/ASAHO6840420465";
var MESES2 = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function fechaDeTitulo(titulo) {
  const m = /(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/i.exec(titulo);
  const mes = m ? MESES2.indexOf(sinTildes(m[2])) : -1;
  return m && mes >= 0 ? `${m[3]}-${String(mes + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
}
__name(fechaDeTitulo, "fechaDeTitulo");
async function episodioDeSigno(http, feed, signo, hoy) {
  const xml = String((await http.get(feed, { timeout: 8e3, maxBytes: 15e4, headers: { "User-Agent": "Mozilla/5.0 Nexora/1.0" } })).data);
  const clave = `horoscopo diario de ${sinTildes(signo.nombre)}`;
  const candidatos = leerEpisodios(xml, 80).flatMap((e) => {
    const fecha = fechaDeTitulo(e.titulo);
    const url = urlSegura(e.enlace) || urlSegura(e.audioUrl);
    return fecha && url && sinTildes(e.titulo).includes(clave) ? [{ titulo: e.titulo, fecha, url }] : [];
  });
  return candidatos.find((c) => c.fecha === hoy) ?? candidatos.reduce((a, c) => !a || c.fecha > a.fecha ? c : a, null);
}
__name(episodioDeSigno, "episodioDeSigno");

// ../firebase/functions/src/fechas.ts
var FORMATOS = /* @__PURE__ */ new Map();
function formatoPartes(zona) {
  let f = FORMATOS.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zona,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      weekday: "short"
    });
    FORMATOS.set(zona, f);
  }
  return f;
}
__name(formatoPartes, "formatoPartes");
function partesEnZona(fecha, zona) {
  const f = formatoPartes(zona).formatToParts(fecha);
  const g = /* @__PURE__ */ __name((t) => f.find((p) => p.type === t).value, "g");
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday"));
  return { y: +g("year"), m: +g("month"), d: +g("day"), h: +g("hour"), mi: +g("minute"), dow };
}
__name(partesEnZona, "partesEnZona");
function localAUtc(y, m, d, h, mi, zona) {
  const nominal = Date.UTC(y, m - 1, d, h, mi);
  let utc = nominal;
  for (let i = 0; i < 3; i++) {
    const p = partesEnZona(new Date(utc), zona);
    const visto = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
    const desfase = visto - utc;
    const siguiente = nominal - desfase;
    if (siguiente === utc) break;
    utc = siguiente;
  }
  return new Date(utc);
}
__name(localAUtc, "localAUtc");
function fechaIso(fecha, zona) {
  const p = partesEnZona(fecha, zona);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}
__name(fechaIso, "fechaIso");
function sumarDias(y, m, d, dias) {
  const t = new Date(Date.UTC(y, m - 1, d + dias));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}
__name(sumarDias, "sumarDias");
function parseHoraHHMM(texto) {
  const m = /^\s*(\d{1,2})[:.hH](\d{2})\s*$/.exec(texto) ?? /^\s*(\d{1,2})\s*[hH]?\s*$/.exec(texto);
  if (!m) return null;
  const h = +m[1];
  const mi = m[2] === void 0 ? 0 : +m[2];
  return h >= 0 && h <= 23 && mi >= 0 && mi <= 59 ? [h, mi] : null;
}
__name(parseHoraHHMM, "parseHoraHHMM");
function formatoHHMM(h, mi) {
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}
__name(formatoHHMM, "formatoHHMM");
function proximaOcurrencia(hhmm2, zona, desde) {
  const [h, mi] = parseHoraHHMM(hhmm2) ?? [8, 0];
  const p = partesEnZona(desde, zona);
  const hoy = localAUtc(p.y, p.m, p.d, h, mi, zona);
  if (hoy.getTime() > desde.getTime()) return hoy;
  const n = sumarDias(p.y, p.m, p.d, 1);
  return localAUtc(n.y, n.m, n.d, h, mi, zona);
}
__name(proximaOcurrencia, "proximaOcurrencia");
function siguienteRepeticion(fecha, rep, zona) {
  if (rep === "ninguna") return null;
  const p = partesEnZona(fecha, zona);
  if (rep === "anual") return localAUtc(p.y + 1, p.m, p.m === 2 && p.d === 29 ? 28 : p.d, p.h, p.mi, zona);
  let dias = 1;
  if (rep === "semanal") dias = 7;
  if (rep === "laborables") {
    const sig = (p.dow + 1) % 7;
    dias = sig === 6 ? 3 : sig === 0 ? 2 : 1;
  }
  const n = sumarDias(p.y, p.m, p.d, dias);
  return localAUtc(n.y, n.m, n.d, p.h, p.mi, zona);
}
__name(siguienteRepeticion, "siguienteRepeticion");
var MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
var DIAS_CORTOS = ["dom", "lun", "mar", "mi\xE9", "jue", "vie", "s\xE1b"];
function formatearFechaHora(fecha, zona, ahora) {
  const p = partesEnZona(fecha, zona);
  const hora2 = formatoHHMM(p.h, p.mi);
  if (ahora) {
    const a = partesEnZona(ahora, zona);
    const dif = Math.round((Date.UTC(p.y, p.m - 1, p.d) - Date.UTC(a.y, a.m - 1, a.d)) / 864e5);
    if (dif === 0) return `hoy \xB7 ${hora2}`;
    if (dif === 1) return `ma\xF1ana \xB7 ${hora2}`;
  }
  return `${DIAS_CORTOS[p.dow]} ${p.d} ${MESES_CORTOS[p.m - 1]} \xB7 ${hora2}`;
}
__name(formatearFechaHora, "formatearFechaHora");
function parseNacimiento(texto, hoy = /* @__PURE__ */ new Date()) {
  const m = /^\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\s*$/.exec(texto);
  if (!m) return null;
  const d = +m[1];
  const mo = +m[2];
  const y = +m[3];
  const f = new Date(Date.UTC(y, mo - 1, d));
  if (f.getUTCFullYear() !== y || f.getUTCMonth() !== mo - 1 || f.getUTCDate() !== d) return null;
  if (f.getTime() > hoy.getTime() || y < 1900) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
__name(parseNacimiento, "parseNacimiento");

// ../firebase/functions/src/apariencia.ts
var LAT_DEFECTO = 40.4;
var LON_DEFECTO = -3.7;
var RAD = Math.PI / 180;
function solDelDia(y, m, d, lat, lon) {
  const base = Date.UTC(y, m - 1, d);
  const doy = Math.round((base - Date.UTC(y, 0, 1)) / 864e5) + 1;
  const g = 2 * Math.PI / 365 * (doy - 1);
  const eq = 229.18 * (75e-6 + 1868e-6 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const dec = 6918e-6 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 6758e-6 * Math.cos(2 * g) + 907e-6 * Math.sin(2 * g) - 2697e-6 * Math.cos(3 * g) + 148e-5 * Math.sin(3 * g);
  const c = Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(dec)) - Math.tan(lat * RAD) * Math.tan(dec);
  if (c > 1) return { amanece: null, anochece: null, polar: "noche" };
  if (c < -1) return { amanece: null, anochece: null, polar: "dia" };
  const ha = Math.acos(c) / RAD;
  const en = /* @__PURE__ */ __name((min) => new Date(base + Math.round(min) * 6e4), "en");
  return { amanece: en(720 - 4 * (lon + ha) - eq), anochece: en(720 - 4 * (lon - ha) - eq), polar: null };
}
__name(solDelDia, "solDelDia");
var coords = /* @__PURE__ */ __name((u) => ({ lat: u.ciudad?.lat ?? LAT_DEFECTO, lon: u.ciudad?.lon ?? LON_DEFECTO }), "coords");
function solDeUsuario(u, ahora) {
  const p = partesEnZona(ahora, u.zona), { lat, lon } = coords(u);
  return solDelDia(p.y, p.m, p.d, lat, lon);
}
__name(solDeUsuario, "solDeUsuario");
function modoEfectivo(u, ahora) {
  if (u.modo !== "auto") return u.modo;
  const s = solDeUsuario(u, ahora);
  if (s.polar) return s.polar === "dia" ? "claro" : "oscuro";
  return ahora < s.amanece || ahora >= s.anochece ? "oscuro" : "claro";
}
__name(modoEfectivo, "modoEfectivo");
var hora = /* @__PURE__ */ __name((f, zona) => {
  const p = partesEnZona(f, zona);
  return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}, "hora");
function textoSol(u, ahora) {
  const s = solDeUsuario(u, ahora);
  if (s.polar) return s.polar === "dia" ? "hoy el sol no se pone" : "hoy el sol no sale";
  return `amanece ${hora(s.amanece, u.zona)} \xB7 anochece ${hora(s.anochece, u.zona)}`;
}
__name(textoSol, "textoSol");

// ../firebase/functions/src/html.ts
var esc = /* @__PURE__ */ __name((s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), "esc");
var escAttr = /* @__PURE__ */ __name((s) => esc(s).replace(/"/g, "&quot;"), "escAttr");

// ../firebase/functions/src/secciones/agenda.ts
var EMOJI_TIPO = { alarma: "\u23F0", cita: "\u{1FA7A}", tarea: "\u2705", mensaje: "\u{1F4AC}", nota: "\u{1F4DD}" };
var hhmm = /* @__PURE__ */ __name((d, zona) => {
  const p = partesEnZona(d, zona);
  return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}, "hhmm");
async function contenidoAgenda(ctx) {
  const { usuario: u, ahora } = ctx;
  const todos = await ctx.almacen.listarEventos(u.id);
  const hoy = fechaIso(ahora, u.zona);
  const manana = fechaIso(new Date(ahora.getTime() + 24 * 36e5), u.zona);
  const proximos = todos.filter((e) => e.tipo !== "tarea" && e.fechaHora && [hoy, manana].includes(fechaIso(e.fechaHora, u.zona)) && (e.repeticion !== "ninguna" || e.fechaHora.getTime() >= ahora.getTime() - 36e5)).sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime());
  const tareas = todos.filter((e) => e.tipo === "tarea" && !e.hecho);
  const lineasEv = proximos.map((e) => `${EMOJI_TIPO[e.tipo]} ${fechaIso(e.fechaHora, u.zona) === hoy ? "hoy" : "ma\xF1ana"} ${hhmm(e.fechaHora, u.zona)} \xB7 ${esc(e.titulo)}${e.lugar ? ` (${esc(e.lugar)})` : ""}`);
  const lineasTa = tareas.map((e) => `\u2022 ${esc(e.titulo)}${e.fechaHora ? ` <i>(${formatearFechaHora(e.fechaHora, u.zona, ahora)})</i>` : ""}`);
  const html = [
    cabecera("\u{1F5D3}", "Tu agenda"),
    "\u{1F4CC} <b>Hoy y ma\xF1ana</b>\n" + (lineasEv.length ? lineasEv.join("\n") : "<i>Sin citas ni alarmas.</i>"),
    "\u{1F4DD} <b>Tareas pendientes</b>\n" + (lineasTa.length ? lineasTa.join("\n") : "<i>Nada pendiente \u{1F389}</i>")
  ].join("\n\n");
  return { html, acciones: [{ texto: "\u2795 Nueva", ir: "eventos" }, { texto: "\u{1F4C5} Mis eventos", ir: "eventos" }] };
}
__name(contenidoAgenda, "contenidoAgenda");

// ../firebase/functions/src/whatsapp.ts
function normalizarTelefono(texto) {
  let d = texto.replace(/[\s().-]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (/^[6-9]\d{8}$/.test(d)) d = "34" + d;
  return /^\d{8,15}$/.test(d) ? d : null;
}
__name(normalizarTelefono, "normalizarTelefono");
var enlaceWhatsApp = /* @__PURE__ */ __name((m) => `https://wa.me/${m.telefono}?text=${encodeURIComponent(m.texto)}`, "enlaceWhatsApp");

// ../firebase/functions/src/scheduler.ts
var MAX_SECCION_RETRASO = 3 * 36e5;
var MAX_EVENTO_RETRASO = 24 * 36e5;
var CONCESION_MS = 10 * 6e4;
var REINTENTO_SECCION_MS = 10 * 6e4;
var MAX_INTENTOS_SECCION = 3;
var REINTENTO_EVENTO_MS = 2 * 6e4;
var MAX_INTENTOS_EVENTO = 5;
function configSeccion(u, ref) {
  return ref.startsWith("tema:") ? u.temas.find((t) => `tema:${t.id}` === ref) : u.secciones[ref];
}
__name(configSeccion, "configSeccion");
async function entregar(dep, u, aviso) {
  const suscripciones = u.notificaciones.suscripciones;
  if (dep.push && suscripciones.length) {
    const vivas = [];
    let entregadas = 0;
    for (const s of suscripciones) {
      const resultado = await dep.push(s, aviso);
      if (resultado === "ok") entregadas++;
      if (resultado !== "caducada") vivas.push(s);
    }
    if (vivas.length !== suscripciones.length) {
      u.notificaciones.suscripciones = vivas;
      await dep.almacen.guardarUsuario(u);
    }
    if (!entregadas) throw new Error("No se pudo entregar la notificaci\xF3n a ning\xFAn dispositivo");
  } else throw new Error("No hay dispositivos configurados para recibir notificaciones push");
}
__name(entregar, "entregar");
var tituloSeccion = /* @__PURE__ */ __name((u, ref) => {
  if (ref.startsWith("tema:")) {
    const t = u.temas.find((x) => `tema:${x.id}` === ref);
    return t ? `${t.emoji} ${t.titulo}` : "\u2B50 Noticias";
  }
  const i = SECCIONES[ref];
  return i ? `${i.emoji} ${i.titulo}` : "\u{1F4EC} Tu resumen";
}, "tituloSeccion");
async function enviarSeccion(dep, u, p, ahora, r) {
  const cfg = configSeccion(u, p.ref);
  if (!cfg || !cfg.activa) {
    await dep.almacen.borrarProgramacion(p.id);
    return;
  }
  const siguiente = proximaOcurrencia(cfg.hora, u.zona, ahora);
  const tarde = ahora.getTime() - p.proximo.getTime() > MAX_SECCION_RETRASO;
  if (!await dep.almacen.reclamarProgramacion(p.id, p.proximo, tarde ? siguiente : new Date(ahora.getTime() + CONCESION_MS))) {
    r.omitidos++;
    return;
  }
  if (tarde) {
    r.omitidos++;
    return;
  }
  try {
    const sonido = u.notificaciones.sonido ?? "signature", modo = modoEfectivo(u, ahora);
    await entregar(dep, u, { sonido, modo, titulo: tituloSeccion(u, p.ref), cuerpo: "Tu resumen est\xE1 listo. Toca para verlo.", url: `/app/?ver=${encodeURIComponent(p.ref)}`, etiqueta: `seccion-${p.ref}` });
    await dep.almacen.guardarProgramacion({ ...p, proximo: siguiente, intentos: 0 });
    r.enviados++;
  } catch (e) {
    r.fallidos++;
    dep.log?.(`\u2717 ${u.id} ${p.ref}: ${e.message}`);
    const n = (p.intentos ?? 0) + 1;
    if (n <= MAX_INTENTOS_SECCION) await dep.almacen.guardarProgramacion({ ...p, proximo: new Date(ahora.getTime() + REINTENTO_SECCION_MS), intentos: n });
    else await dep.almacen.guardarProgramacion({ ...p, proximo: siguiente, intentos: 0 });
  }
}
__name(enviarSeccion, "enviarSeccion");
async function enviarEvento(dep, u, p, ahora, r) {
  const ev = await dep.almacen.getEvento(u.id, p.ref);
  if (!ev || ev.hecho) {
    await dep.almacen.borrarProgramacion(p.id);
    return;
  }
  const retraso = ahora.getTime() - p.proximo.getTime();
  let nuevoEvento = null;
  let siguiente = new Date(ahora.getTime() + 24 * 36e5);
  if (!p.posponer && ev.repeticion !== "ninguna") {
    let f = ev.fechaHora;
    let guarda = 0;
    do {
      f = f ? siguienteRepeticion(f, ev.repeticion, u.zona) : null;
    } while (f && momentoAviso({ ...ev, fechaHora: f }).getTime() <= ahora.getTime() && guarda++ < 800);
    if (!f) {
      await dep.almacen.borrarProgramacion(p.id);
      return;
    }
    nuevoEvento = { ...ev, fechaHora: f, avisado: false };
    siguiente = momentoAviso(nuevoEvento);
  }
  if (!await dep.almacen.reclamarProgramacion(p.id, p.proximo, retraso > MAX_EVENTO_RETRASO ? siguiente : new Date(ahora.getTime() + CONCESION_MS))) {
    r.omitidos++;
    return;
  }
  if (retraso > MAX_EVENTO_RETRASO) {
    r.omitidos++;
  } else {
    try {
      const sonido = u.notificaciones.sonido, modo = modoEfectivo(u, ahora);
      const aviso = ev.mensaje ? { sonido, modo, titulo: `\u{1F4AC} Enviar a ${ev.mensaje.para || "tu contacto"}`, cuerpo: ev.mensaje.texto.length > 100 ? ev.mensaje.texto.slice(0, 99) + "\u2026" : ev.mensaje.texto, url: `/app/?wa=${encodeURIComponent(ev.id)}`, etiqueta: `evento-${ev.id}`, enlace: { texto: "\u{1F4AC} Enviar por WhatsApp", url: enlaceWhatsApp(ev.mensaje) } } : { sonido, modo, titulo: `${EMOJI_TIPO[ev.tipo]} ${ev.titulo}`, cuerpo: ev.fechaHora ? formatearFechaHora(ev.fechaHora, u.zona, ahora) : "Recordatorio", url: `/app/?ir=${ev.tipo}`, etiqueta: `evento-${ev.id}` };
      await entregar(dep, u, aviso);
      r.enviados++;
    } catch (e) {
      r.fallidos++;
      dep.log?.(`\u2717 ${u.id} evento ${ev.id}: ${e.message}`);
      const n = (p.intentos ?? 0) + 1;
      if (n <= MAX_INTENTOS_EVENTO) {
        await dep.almacen.guardarProgramacion({ ...p, proximo: new Date(ahora.getTime() + REINTENTO_EVENTO_MS), intentos: n });
        return;
      }
    }
  }
  if (nuevoEvento) {
    await dep.almacen.guardarEvento(nuevoEvento);
    await dep.almacen.guardarProgramacion({ ...p, proximo: siguiente, intentos: 0 });
    return;
  }
  await dep.almacen.borrarProgramacion(p.id);
  if (!p.posponer) await dep.almacen.guardarEvento({ ...ev, avisado: true });
}
__name(enviarEvento, "enviarEvento");
async function procesarProgramacion(dep, p) {
  const ahora = dep.ahora();
  const r = { enviados: 0, omitidos: 0, fallidos: 0 };
  try {
    const u = await dep.almacen.getUsuario(p.uid);
    if (!u) {
      await dep.almacen.borrarProgramacion(p.id);
      return r;
    }
    if (p.tipo === "seccion") await enviarSeccion(dep, u, p, ahora, r);
    else await enviarEvento(dep, u, p, ahora, r);
  } catch (e) {
    r.fallidos++;
    dep.log?.(`\u2717 programaci\xF3n ${p.id}: ${e.message}`);
  }
  return r;
}
__name(procesarProgramacion, "procesarProgramacion");
var sumar = /* @__PURE__ */ __name((a, b) => ({ enviados: a.enviados + b.enviados, omitidos: a.omitidos + b.omitidos, fallidos: a.fallidos + b.fallidos }), "sumar");

// ../firebase/functions/src/signos.ts
var EXTRA = {
  aries: ["\u2648", "fuego"],
  tauro: ["\u2649", "tierra"],
  geminis: ["\u264A", "aire"],
  cancer: ["\u264B", "agua"],
  leo: ["\u264C", "fuego"],
  virgo: ["\u264D", "tierra"],
  libra: ["\u264E", "aire"],
  escorpio: ["\u264F", "agua"],
  sagitario: ["\u2650", "fuego"],
  capricornio: ["\u2651", "tierra"],
  acuario: ["\u2652", "aire"],
  piscis: ["\u2653", "agua"]
};
function signoDe(iso) {
  const m = +iso.slice(5, 7), d = +iso.slice(8, 10);
  const id = m === 3 && d >= 21 || m === 4 && d <= 19 ? "aries" : m === 4 || m === 5 && d <= 20 ? "tauro" : m === 5 || m === 6 && d <= 20 ? "geminis" : m === 6 || m === 7 && d <= 22 ? "cancer" : m === 7 || m === 8 && d <= 22 ? "leo" : m === 8 || m === 9 && d <= 22 ? "virgo" : m === 9 || m === 10 && d <= 22 ? "libra" : m === 10 || m === 11 && d <= 21 ? "escorpio" : m === 11 || m === 12 && d <= 21 ? "sagitario" : m === 12 || m === 1 && d <= 19 ? "capricornio" : m === 1 || m === 2 && d <= 18 ? "acuario" : "piscis";
  const s = SIGNOS.find((x) => x.id === id);
  return { ...s, simbolo: EXTRA[id][0], elemento: EXTRA[id][1] };
}
__name(signoDe, "signoDe");

// ../firebase/functions/src/secciones/horoscopo.ts
async function contenidoHoroscopo(ctx) {
  const nac = ctx.usuario.nacimiento;
  if (!nac) {
    return { html: "\u{1F52E} <b>Hor\xF3scopo</b>\nPara darte tu hor\xF3scopo necesito tu fecha de nacimiento.", acciones: [{ texto: "\u{1F382} Indicar mi fecha de nacimiento", ir: "perfil" }] };
  }
  const signo = signoDe(nac);
  let doc = await ctx.almacen.getHoroscopo(signo.id);
  const hoyFecha = fechaIso(ctx.ahora, ctx.usuario.zona);
  if ((!doc || doc.fecha !== hoyFecha) && ctx.horoscopoCfg) {
    try {
      const resp = await obtenerHoroscopo(ctx.http, ctx.horoscopoCfg, signo, hoyFecha, 2, 300);
      const nuevo = construirDoc(signo, hoyFecha, resp, ctx.horoscopoCfg, ctx.ahora);
      if (nuevo && (!doc || nuevo.fecha >= doc.fecha)) {
        doc = nuevo;
        await ctx.almacen.guardarHoroscopo(signo.id, nuevo).catch(() => void 0);
      }
    } catch {
    }
  }
  if (!doc || !doc.prediccion?.trim()) {
    return { html: `\u{1F52E} <b>Hor\xF3scopo \xB7 ${signo.simbolo} ${signo.nombre}</b>
Todav\xEDa no hay hor\xF3scopo publicado para hoy. Lo intentar\xE9 de nuevo m\xE1s tarde.`, acciones: [{ texto: "\u{1F504} Reintentar", ref: "horoscopo" }] };
  }
  const hoy = fechaIso(ctx.ahora, ctx.usuario.zona);
  const desactualizado = doc.fecha !== hoy;
  const url = doc.fuenteUrl ? urlSegura(doc.fuenteUrl) : "";
  const original = doc;
  const episodio = ctx.podcastFeed ? await (async () => {
    const feed = ctx.podcastFeed;
    try {
      return await cacheado(ctx.almacen, `podcast:${signo.id}:${hoy}`, 30 * 6e4, ctx.ahora, () => conPlazo(episodioDeSigno(ctx.http, feed, signo, hoy), 7e3));
    } catch {
      return null;
    }
  })() : null;
  const enlaceFuente = url ? `<a href="${escAttr(url)}">${esc(original.fuente || "20minutos.es")}</a>` : esc(original.fuente || "20minutos.es");
  const html = [
    cabecera("\u{1F52E}", `Hor\xF3scopo \xB7 ${signo.simbolo} ${signo.nombre}`),
    desactualizado ? `\u26A0\uFE0F <i>A\xFAn no se ha publicado el de hoy: este es el del ${doc.fecha}.</i>` : "",
    esc(original.prediccion.trim())
  ].filter(Boolean).join("\n\n") + `

<i>Fuente:</i> ${enlaceFuente}`;
  const acciones = episodio ? [{ texto: episodio.fecha === hoy ? "\u{1F3A7} Escuchar Hor\xF3scopo Ampliado" : `\u{1F3A7} Escuchar Hor\xF3scopo Ampliado (${episodio.fecha.slice(8)}/${episodio.fecha.slice(5, 7)})`, url: episodio.url }] : [];
  return { html, acciones };
}
__name(contenidoHoroscopo, "contenidoHoroscopo");

// ../firebase/functions/src/rss.ts
var ENTIDADES3 = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\xA0" };
function decodificar2(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try {
        return String.fromCodePoint(n);
      } catch {
        return m;
      }
    }
    return ENTIDADES3[e.toLowerCase()] ?? m;
  });
}
__name(decodificar2, "decodificar");
function etiqueta2(bloque, nombre) {
  let desde = 0;
  for (; ; ) {
    const ini = bloque.indexOf(`<${nombre}`, desde);
    if (ini < 0) return "";
    const c = bloque[ini + nombre.length + 1];
    if (c !== ">" && c !== " " && c !== "/" && c !== "\n" && c !== "	" && c !== "\r") {
      desde = ini + 1;
      continue;
    }
    const finApertura = bloque.indexOf(">", ini);
    if (finApertura < 0) return "";
    if (bloque[finApertura - 1] === "/") return "";
    const cierre = bloque.indexOf(`</${nombre}>`, finApertura);
    if (cierre < 0) return "";
    const crudo = bloque.slice(finApertura + 1, cierre).trim();
    const cdata = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(crudo);
    return (cdata ? cdata[1] : decodificar2(crudo)).trim();
  }
}
__name(etiqueta2, "etiqueta");
function leerRss(xml) {
  const noticias = [];
  let pos = 0;
  for (; ; ) {
    const ini = xml.indexOf("<item", pos);
    if (ini < 0) break;
    const c = xml[ini + 5];
    if (c !== ">" && c !== " " && c !== "\n") {
      pos = ini + 5;
      continue;
    }
    const fin = xml.indexOf("</item>", ini);
    if (fin < 0) break;
    pos = fin + 7;
    const it = xml.slice(ini, fin);
    let titulo = etiqueta2(it, "title");
    if (!titulo) continue;
    let fuente = etiqueta2(it, "source") || etiqueta2(it, "News:Source");
    const i = titulo.lastIndexOf(" - ");
    if (i > 0 && (!fuente || titulo.endsWith(` - ${fuente}`))) {
      if (!fuente) fuente = titulo.slice(i + 3);
      titulo = titulo.slice(0, i);
    }
    const fecha = Date.parse(etiqueta2(it, "pubDate"));
    const imagen = imagenSegura(etiqueta2(it, "News:Image"));
    noticias.push({ titulo, fuente, enlace: enlaceReal(etiqueta2(it, "link")), fecha: Number.isNaN(fecha) ? 0 : fecha, ...imagen ? { imagen } : {} });
  }
  return noticias;
}
__name(leerRss, "leerRss");
function imagenSegura(url) {
  if (!url) return "";
  const u = url.replace(/^http:\/\//i, "https://");
  if (!/^https:\/\//i.test(u) || u.length > 400) return "";
  return /bing\.com\/th/i.test(u) && !/[?&]w=/.test(u) ? `${u}&w=360&h=220&c=7&rs=1` : u;
}
__name(imagenSegura, "imagenSegura");
function enlaceReal(enlace) {
  try {
    const u = new URL(enlace);
    if (/(^|\.)bing\.com$/.test(u.hostname)) {
      const destino = u.searchParams.get("url");
      if (destino) return destino;
    }
  } catch {
  }
  return enlace;
}
__name(enlaceReal, "enlaceReal");
var urlGoogleNews = /* @__PURE__ */ __name((consulta, idioma = "es", pais = "ES") => `https://news.google.com/rss/search?q=${encodeURIComponent(consulta)}&hl=${idioma}&gl=${pais}&ceid=${pais}:${idioma}`, "urlGoogleNews");
var urlBingNews = /* @__PURE__ */ __name((consulta) => `https://www.bing.com/news/search?q=${encodeURIComponent(consulta.replace(/\bwhen:\S+/g, "").replace(/\s+/g, " ").trim())}&format=rss&setlang=es-ES&cc=ES`, "urlBingNews");
function enlaceSeguro(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}
__name(enlaceSeguro, "enlaceSeguro");
function lineaNoticia(n) {
  const url = enlaceSeguro(n.enlace);
  const titulo = url ? `<a href="${escAttr(url)}">${esc(n.titulo)}</a>` : esc(n.titulo);
  return `\u2022 ${titulo}${n.fuente ? ` <i>(${esc(n.fuente)})</i>` : ""}`;
}
__name(lineaNoticia, "lineaNoticia");

// ../firebase/functions/src/secciones/noticias.ts
var CABECERAS = { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept-Language": "es-ES,es;q=0.9", Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8" };
async function pedirRss(ctx, url) {
  const r = await conReintentos(() => ctx.http.get(url, { timeout: 6e3, headers: CABECERAS }), 2, 300);
  const noticias = leerRss(String(r.data));
  if (noticias.length === 0) throw new Error("sin noticias en la respuesta");
  return noticias;
}
__name(pedirRss, "pedirRss");
var ESPERA_RESPALDO_MS = 1500;
async function noticiasDe(ctx, consulta) {
  return cacheado(ctx.almacen, `rss:${consulta}`, 30 * 6e4, ctx.ahora, async () => {
    const bing = pedirRss(ctx, urlBingNews(consulta));
    const estadoBing = bing.then(() => "ok", () => "fallo");
    const google = (async () => {
      const e = await Promise.race([estadoBing, new Promise((r) => setTimeout(() => r("lento"), ESPERA_RESPALDO_MS))]);
      if (e === "ok") throw new Error("no hizo falta");
      return pedirRss(ctx, urlGoogleNews(consulta));
    })();
    try {
      const lista = await Promise.any([bing, google]);
      return lista.sort((a, b) => b.fecha - a.fecha).slice(0, 12);
    } catch (e) {
      const motivos = e.errors?.map((x) => x.message).filter((m) => m !== "no hizo falta").join(" \xB7 ") ?? e.message;
      throw new Error(`Bing y Google sin respuesta (${motivos})`.slice(0, 160));
    }
  });
}
__name(noticiasDe, "noticiasDe");
var sinEtiquetas = /* @__PURE__ */ __name((t) => t.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim(), "sinEtiquetas");
async function armarNoticias(ctx, cabecera2, secciones, porSeccion = 4) {
  const vistas = /* @__PURE__ */ new Set();
  const bloques = [];
  const grupos = [];
  let ok2 = 0;
  let motivo = "";
  const respuestas = await Promise.allSettled(secciones.map((s) => noticiasDe(ctx, s.consulta)));
  secciones.forEach((s, i) => {
    const r = respuestas[i];
    if (r.status === "rejected") {
      motivo ||= String(r.reason?.message ?? r.reason);
      bloques.push(`${s.titulo}
\u26A0\uFE0F <i>No disponible ahora.</i>`);
      return;
    }
    const items = r.value.filter((n) => {
      const k = n.titulo.toLowerCase().slice(0, 60);
      if (vistas.has(k)) return false;
      vistas.add(k);
      return true;
    }).slice(0, porSeccion);
    ok2++;
    const t = s.titulo ? `${s.titulo}
` : "";
    bloques.push(items.length ? `${t}${items.map(lineaNoticia).join("\n")}` : `${t}<i>Sin novedades.</i>`);
    if (items.length) grupos.push({ titulo: sinEtiquetas(s.titulo), noticias: items.map((n) => ({ titulo: n.titulo, fuente: n.fuente, enlace: n.enlace, fecha: n.fecha, ...n.imagen ? { imagen: n.imagen } : {} })) });
  });
  if (ok2 === 0) throw new Error(motivo || "no se pudo obtener ninguna noticia");
  return { html: [cabecera2, ...bloques].join("\n\n"), grupos };
}
__name(armarNoticias, "armarNoticias");
async function resumenNoticias(ctx, cabecera2, secciones, porSeccion = 4) {
  return (await armarNoticias(ctx, cabecera2, secciones, porSeccion)).html;
}
__name(resumenNoticias, "resumenNoticias");
async function contenidoNoticias(ctx) {
  const secciones = [
    { titulo: "\u{1F4B6} <b>Econom\xEDa</b>", consulta: "econom\xEDa Espa\xF1a when:1d" },
    { titulo: "\u{1F3DB} <b>Pol\xEDtica</b>", consulta: "pol\xEDtica nacional Espa\xF1a when:1d" }
  ];
  const c = ctx.usuario.ciudad;
  if (c) {
    const prov = c.provincia && c.provincia.toLowerCase() !== c.nombre.toLowerCase() ? ` "${c.provincia}"` : "";
    secciones.push(
      { titulo: `\u{1F3DB} <b>Ayuntamiento de ${esc(c.nombre)}</b>`, consulta: `("Ayuntamiento de ${c.nombre}" OR "alcalde de ${c.nombre}" OR "alcaldesa de ${c.nombre}") Espa\xF1a${prov} when:7d` },
      { titulo: `\u{1F4CD} <b>${esc(c.nombre)}</b>`, consulta: `"${c.nombre}" Espa\xF1a${prov} when:7d` }
    );
  }
  const r = await armarNoticias(ctx, cabecera("\u{1F4F0}", "Noticias del d\xEDa"), secciones);
  return { html: r.html, grupos: r.grupos };
}
__name(contenidoNoticias, "contenidoNoticias");
async function contenidoTema(ctx, temaId) {
  const t = ctx.usuario.temas.find((x) => x.id === temaId);
  if (!t) return { html: "No encuentro ese tema." };
  const r = await armarNoticias(ctx, cabecera(esc(t.emoji), esc(t.titulo)), [{ titulo: "", consulta: `${t.consulta} when:2d` }], 7);
  return { html: r.html, grupos: r.grupos };
}
__name(contenidoTema, "contenidoTema");

// ../firebase/functions/src/secciones/mercados.ts
var PLAZO_COTIZACIONES_MS = 9e3;
var FUTUROS = [
  ["S&P 500 fut.", "ES=F"],
  ["Nasdaq 100 fut.", "NQ=F"],
  ["Dow Jones fut.", "YM=F"],
  ["VIX", "^VIX"],
  ["Petr\xF3leo WTI", "CL=F"],
  ["Oro", "GC=F"],
  ["EUR/USD", "EURUSD=X"],
  ["Bono EEUU 10a (%)", "^TNX"],
  ["Bitcoin", "BTC-USD"]
];
var INDICES = [
  ["S&P 500", "^GSPC"],
  ["Nasdaq", "^IXIC"],
  ["Dow Jones", "^DJI"],
  ["Russell 2000", "^RUT"],
  ["IBEX 35", "^IBEX"],
  ["Euro Stoxx 50", "^STOXX50E"],
  ["DAX", "^GDAXI"],
  ["Nikkei 225", "^N225"]
];
function parsearGrafico(json) {
  const r = json?.chart?.result?.[0];
  if (!r) throw new Error("respuesta de Yahoo sin datos");
  const meta = r.meta ?? {};
  const desfase = meta.gmtoffset ?? 0;
  const cierres = [];
  const ts = r.timestamp ?? [];
  const cl = r.indicators?.quote?.[0]?.close ?? [];
  ts.forEach((t, i) => {
    const c = cl[i];
    if (c !== null && c !== void 0) cierres.push({ fecha: new Date((t + desfase) * 1e3).toISOString().slice(0, 10), cierre: c });
  });
  return { precio: meta.regularMarketPrice, ultimaCotizacion: meta.regularMarketTime ?? ts[ts.length - 1] ?? 0, desfase, cierres, cierreAnterior: meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice };
}
__name(parsearGrafico, "parsearGrafico");
function cotizacionActual(g) {
  const diaPrecio = new Date((g.ultimaCotizacion + g.desfase) * 1e3).toISOString().slice(0, 10);
  const prev = [...g.cierres].reverse().find((c) => c.fecha < diaPrecio)?.cierre ?? g.cierreAnterior;
  return { precio: g.precio, anterior: prev };
}
__name(cotizacionActual, "cotizacionActual");
function ultimaSesion(g, hoy) {
  const cerradas = g.cierres.filter((c) => c.fecha < hoy);
  if (cerradas.length < 2) return null;
  const ult = cerradas[cerradas.length - 1];
  return { precio: ult.cierre, anterior: cerradas[cerradas.length - 2].cierre, fecha: ult.fecha };
}
__name(ultimaSesion, "ultimaSesion");
var variacion = /* @__PURE__ */ __name((c) => c.anterior === 0 ? 0 : (c.precio - c.anterior) / c.anterior * 100, "variacion");
var flecha = /* @__PURE__ */ __name((p) => p > 0.05 ? "\u{1F7E2}" : p < -0.05 ? "\u{1F534}" : "\u26AA", "flecha");
var cifra = /* @__PURE__ */ __name((v) => Math.abs(v) >= 1e3 ? num0(v) : Math.abs(v) < 10 ? v.toFixed(4).replace(".", ",") : v.toFixed(2).replace(".", ","), "cifra");
function lineaCotizacion(nombre, c) {
  const p = variacion(c);
  return `${flecha(p)} ${nombre} <b>${cifra(c.precio)}</b> (${pct(p)})${c.fecha ? ` <i>\xB7 ${c.fecha}</i>` : ""}`;
}
__name(lineaCotizacion, "lineaCotizacion");
async function pedir(ctx, simbolo) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(simbolo)}?range=10d&interval=1d`;
  const r = await conReintentos(() => ctx.http.get(url, { timeout: 6e3, headers: { "User-Agent": "Mozilla/5.0 AgendaPersonalBot/1.0" } }), 2, 300);
  return parsearGrafico(r.data);
}
__name(pedir, "pedir");
async function contenidoMercados(ctx) {
  const hoy = fechaIso(ctx.ahora, "Europe/Madrid");
  const clave = `mercados:${hoy}:${Math.floor(ctx.ahora.getTime() / (20 * 6e4))}`;
  const bloque = await cacheado(ctx.almacen, clave, 20 * 6e4, ctx.ahora, async () => {
    const [fut, ind] = await Promise.all([
      Promise.allSettled(FUTUROS.map(([n, s]) => conPlazo((async () => lineaCotizacion(n, cotizacionActual(await pedir(ctx, s))))(), PLAZO_COTIZACIONES_MS))),
      Promise.allSettled(INDICES.map(([n, s]) => conPlazo((async () => {
        const q = ultimaSesion(await pedir(ctx, s), hoy);
        if (!q) throw new Error("sin sesi\xF3n");
        return lineaCotizacion(n, q);
      })(), PLAZO_COTIZACIONES_MS)))
    ]);
    const ok2 = /* @__PURE__ */ __name((r) => r.flatMap((x) => x.status === "fulfilled" ? [x.value] : []), "ok");
    return { fut: ok2(fut), ind: ok2(ind) };
  });
  if (bloque.fut.length === 0 && bloque.ind.length === 0) throw new Error("no se pudo obtener ninguna cotizaci\xF3n");
  const partes = [cabecera("\u{1F4C8}", "Mercados")];
  if (bloque.fut.length) partes.push(`\u{1F1FA}\u{1F1F8} <b>Premercado y activos refugio</b>
${bloque.fut.join("\n")}`);
  if (bloque.ind.length) partes.push(`\u{1F514} <b>Cierre de la \xFAltima sesi\xF3n</b>
${bloque.ind.join("\n")}`);
  let noticias = "";
  try {
    noticias = await resumenNoticias(ctx, "", [
      { titulo: "\u{1F4F0} <b>Noticias de premercado</b>", consulta: "premercado Wall Street futuros when:1d" },
      { titulo: "\u{1F5DE} <b>Cr\xF3nica de mercados</b>", consulta: '"Wall Street" cierre sesi\xF3n Ibex when:2d' }
    ], 3);
  } catch {
  }
  return { html: [...partes, noticias.trim()].filter(Boolean).join("\n\n") };
}
__name(contenidoMercados, "contenidoMercados");

// ../firebase/functions/src/luna.ts
var SINODICO = 29.530588861;
var EPOCA_JD = 245155009766e-5;
var DELTA_T_DIAS = 69 / 86400;
var rad = /* @__PURE__ */ __name((d) => d * Math.PI / 180, "rad");
var sin = Math.sin;
function eventoJd(n, llena) {
  const k = n + (llena ? 0.5 : 0);
  const t = k / 1236.85, t2 = t * t, t3 = t2 * t, t4 = t3 * t;
  let jde = EPOCA_JD + SINODICO * k + 15437e-8 * t2 - 15e-8 * t3 + 73e-11 * t4;
  const e = 1 - 2516e-6 * t - 74e-7 * t2;
  const m = rad(2.5534 + 29.1053567 * k - 14e-7 * t2 - 11e-8 * t3);
  const mp = rad(201.5643 + 385.81693528 * k + 0.0107582 * t2 + 1238e-8 * t3 - 58e-9 * t4);
  const f = rad(160.7108 + 390.67050284 * k - 16118e-7 * t2 - 227e-8 * t3 + 11e-9 * t4);
  const om = rad(124.7746 - 1.56375588 * k + 20672e-7 * t2 + 215e-8 * t3);
  const comun = -111e-5 * sin(mp - 2 * f) - 57e-5 * sin(mp + 2 * f) + 56e-5 * e * sin(2 * mp + m) - 42e-5 * sin(3 * mp) + 42e-5 * e * sin(m + 2 * f) + 38e-5 * e * sin(m - 2 * f) - 24e-5 * e * sin(2 * mp - m) - 17e-5 * sin(om) - 7e-5 * sin(mp + 2 * m);
  jde += llena ? -0.40614 * sin(mp) + 0.17302 * e * sin(m) + 0.01614 * sin(2 * mp) + 0.01043 * sin(2 * f) + 734e-5 * e * sin(mp - m) - 515e-5 * e * sin(mp + m) + 209e-5 * e * e * sin(2 * m) + comun : -0.4072 * sin(mp) + 0.17241 * e * sin(m) + 0.01608 * sin(2 * mp) + 0.01039 * sin(2 * f) + 739e-5 * e * sin(mp - m) - 514e-5 * e * sin(mp + m) + 208e-5 * e * e * sin(2 * m) + comun;
  return jde - DELTA_T_DIAS;
}
__name(eventoJd, "eventoJd");
var aJd = /* @__PURE__ */ __name((d) => d.getTime() / 864e5 + 24405875e-1, "aJd");
var deJd = /* @__PURE__ */ __name((jd) => new Date(Math.round((jd - 24405875e-1) * 864e5)), "deJd");
function cicloEn(jd) {
  const n0 = Math.floor((jd - EPOCA_JD) / SINODICO);
  for (let n = n0 - 1; n <= n0 + 2; n++) {
    const ant = eventoJd(n, false), sig = eventoJd(n + 1, false);
    if (ant <= jd && jd < sig) return [ant, eventoJd(n, true), sig];
  }
  throw new Error("sin ciclo lunar");
}
__name(cicloEn, "cicloEn");
function fraccion(y, m, d, zona) {
  const jd = aJd(localAUtc(y, m, d, 12, 0, zona));
  const [ant, llena, sig] = cicloEn(jd);
  return jd < llena ? 0.5 * (jd - ant) / (llena - ant) : 0.5 + 0.5 * (jd - llena) / (sig - llena);
}
__name(fraccion, "fraccion");
var FASES = [
  { emoji: "\u{1F311}", nombre: "Luna nueva" },
  { emoji: "\u{1F312}", nombre: "Luna creciente" },
  { emoji: "\u{1F313}", nombre: "Cuarto creciente" },
  { emoji: "\u{1F314}", nombre: "Gibosa creciente" },
  { emoji: "\u{1F315}", nombre: "Luna llena" },
  { emoji: "\u{1F316}", nombre: "Gibosa menguante" },
  { emoji: "\u{1F317}", nombre: "Cuarto menguante" },
  { emoji: "\u{1F318}", nombre: "Luna menguante" }
];
function faseDelDia(y, m, d, zona) {
  const f = fraccion(y, m, d, zona);
  const medioDia = 0.5 / SINODICO;
  let idx = Math.floor(f * 8 + 0.5) % 8;
  if (idx % 2 === 0) {
    const centro = idx / 8;
    let dist = Math.abs(f - centro);
    if (idx === 0) dist = Math.min(dist, Math.abs(f - 1));
    if (dist > medioDia) {
      const antes = idx === 0 ? f > 0.5 : f < centro;
      idx = (antes ? idx - 1 + 8 : idx + 1) % 8;
    }
  }
  return FASES[idx];
}
__name(faseDelDia, "faseDelDia");
function iluminacion(y, m, d, zona) {
  return (1 - Math.cos(2 * Math.PI * fraccion(y, m, d, zona))) / 2;
}
__name(iluminacion, "iluminacion");
function edadDias(y, m, d, zona) {
  const jd = aJd(localAUtc(y, m, d, 12, 0, zona));
  return jd - cicloEn(jd)[0];
}
__name(edadDias, "edadDias");
function proximoEvento(desde, llena) {
  const jd = aJd(desde);
  const n0 = Math.floor((jd - EPOCA_JD) / SINODICO);
  for (let n = n0 - 1; n <= n0 + 3; n++) {
    const e = eventoJd(n, llena);
    if (e >= jd) return deJd(e);
  }
  throw new Error("sin evento lunar");
}
__name(proximoEvento, "proximoEvento");
function proximoDia(y, m, d, llena, zona) {
  const p = partesEnZona(proximoEvento(localAUtc(y, m, d, 0, 0, zona), llena), zona);
  return { y: p.y, m: p.m, d: p.d };
}
__name(proximoDia, "proximoDia");

// ../firebase/functions/src/secciones/tiempo.ts
var emojiTiempo = /* @__PURE__ */ __name((c) => c === 0 ? "\u2600\uFE0F" : c <= 2 ? "\u{1F324}" : c === 3 ? "\u2601\uFE0F" : c === 45 || c === 48 ? "\u{1F32B}" : c >= 51 && c <= 57 ? "\u{1F326}" : c >= 61 && c <= 67 ? "\u{1F327}" : c >= 71 && c <= 77 ? "\u2744\uFE0F" : c >= 80 && c <= 82 ? "\u{1F327}" : c === 85 || c === 86 ? "\u{1F328}" : c >= 95 ? "\u26C8" : "\u{1F321}", "emojiTiempo");
var descTiempo = /* @__PURE__ */ __name((c) => c === 0 ? "despejado" : c === 1 ? "poco nuboso" : c === 2 ? "parcialmente nuboso" : c === 3 ? "cubierto" : c === 45 || c === 48 ? "niebla" : c >= 51 && c <= 57 ? "llovizna" : c >= 61 && c <= 65 ? "lluvia" : c === 66 || c === 67 ? "lluvia helada" : c >= 71 && c <= 77 ? "nieve" : c >= 80 && c <= 82 ? "chubascos" : c === 85 || c === 86 ? "chubascos de nieve" : c === 95 ? "tormenta" : c >= 96 ? "tormenta con granizo" : "variable", "descTiempo");
var brujula = /* @__PURE__ */ __name((deg) => ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.floor((deg % 360 + 360) % 360 / 45 + 0.5) % 8], "brujula");
function nivelUv(uv) {
  return uv < 3 ? "bajo" : uv < 6 ? "moderado" : uv < 8 ? "alto" : uv < 11 ? "muy alto" : "extremo";
}
__name(nivelUv, "nivelUv");
function tramosLluvia(horas) {
  const tramos = [];
  let ini = -1;
  const cerrar = /* @__PURE__ */ __name((fin) => {
    if (ini < 0) return;
    const t = horas.slice(ini, fin);
    tramos.push({ desde: t[0].hora, hasta: (t[t.length - 1].hora + 1) % 24, mm: t.reduce((a, h) => a + h.mm, 0), probMax: Math.max(...t.map((h) => h.prob)) });
    ini = -1;
  }, "cerrar");
  horas.forEach((h, i) => {
    if (h.mm >= 0.1 || h.prob >= 60) {
      if (ini < 0) ini = i;
    } else cerrar(i);
  });
  cerrar(horas.length);
  return tramos;
}
__name(tramosLluvia, "tramosLluvia");
var hh = /* @__PURE__ */ __name((n) => String(n).padStart(2, "0"), "hh");
var textoTramo = /* @__PURE__ */ __name((t) => `${hh(t.desde)}\u2013${hh(t.hasta)} h \xB7 ${t.mm >= 0.1 ? `~${num1(t.mm)} l/m\xB2` : "sin acumulaci\xF3n notable"} \xB7 prob. ${t.probMax} %`, "textoTramo");
function parsearPrevision(json, ahora, zona) {
  const d = json.daily, h = json.hourly;
  const p = partesEnZona(ahora, zona);
  const ahoraLocal = `${fechaIso(ahora, zona)}T${hh(p.h)}:00`;
  const idx = h.time.map((t, i) => [t, i]).filter(([t]) => t >= ahoraLocal).slice(0, 18).map(([, i]) => i);
  const horas = idx.map((i) => ({
    fecha: h.time[i].slice(0, 10),
    hora: +h.time[i].slice(11, 13),
    temp: h.temperature_2m[i],
    codigo: h.weather_code[i] ?? 0,
    prob: h.precipitation_probability?.[i] ?? 0,
    mm: h.precipitation?.[i] ?? 0,
    viento: h.wind_speed_10m?.[i] ?? 0,
    humedad: h.relative_humidity_2m?.[i] ?? 0,
    uv: h.uv_index?.[i] ?? 0,
    racha: h.wind_gusts_10m?.[i] ?? 0,
    dir: h.wind_direction_10m?.[i] ?? 0
  }));
  const reloj = /* @__PURE__ */ __name((s) => (s ?? "").slice(11, 16), "reloj");
  return {
    tMin: d.temperature_2m_min[0],
    tMax: d.temperature_2m_max[0],
    codigo: d.weather_code[0] ?? 0,
    horas,
    amanece: reloj(d.sunrise?.[0]),
    anochece: reloj(d.sunset?.[0]),
    uvMax: d.uv_index_max?.[0] ?? 0,
    radiacion: d.shortwave_radiation_sum?.[0] ?? 0,
    vientoMax: d.wind_speed_10m_max?.[0] ?? 0,
    rachaMax: d.wind_gusts_10m_max?.[0] ?? 0,
    dir: d.wind_direction_10m_dominant?.[0] ?? 0,
    anio: p.y
  };
}
__name(parsearPrevision, "parsearPrevision");
var minutos = /* @__PURE__ */ __name((hhmm2) => {
  const [h, m] = hhmm2.split(":").map(Number);
  return h * 60 + m;
}, "minutos");
function bloqueSol(d) {
  if (!d.amanece || !d.anochece) return "";
  const luz = minutos(d.anochece) - minutos(d.amanece);
  return `\u{1F305} <b>Sol</b>
Amanece ${d.amanece} \xB7 Anochece ${d.anochece}
${Math.floor(luz / 60)} h ${luz % 60} min de luz`;
}
__name(bloqueSol, "bloqueSol");
function renderTiempo(d, ciudad, zona, ahora) {
  const p = partesEnZona(ahora, zona);
  const temps = d.horas.map((h) => h.temp);
  const primera = d.horas[0], ultima = d.horas[d.horas.length - 1];
  const bloques = [
    cabecera(emojiTiempo(d.codigo), `Tiempo \xB7 ${esc(ciudad)}`, `${descTiempo(d.codigo).replace(/^./, (c) => c.toUpperCase())} \xB7 m\xEDn ${grados(d.tMin)} / m\xE1x ${grados(d.tMax)}`)
  ];
  if (temps.length >= 2) {
    const iMax = temps.indexOf(Math.max(...temps)), iMin = temps.indexOf(Math.min(...temps));
    bloques.push(`\u{1F321} <b>Temperatura</b> \xB7 ${hh(primera.hora)} \u2192 ${hh(ultima.hora)} h
<code>${sparkline(temps)}</code>
\u{1F53A} M\xE1x ${grados(temps[iMax])} a las ${hh(d.horas[iMax].hora)} h
\u{1F53B} M\xEDn ${grados(temps[iMin])} a las ${hh(d.horas[iMin].hora)} h`);
  }
  const tramos = tramosLluvia(d.horas);
  bloques.push(tramos.length === 0 ? `\u2600\uFE0F <b>Sin lluvia prevista</b>
En las pr\xF3ximas ${d.horas.length} h` : `\u{1F326} <b>Lluvia prevista</b>
${tramos.map((t) => `\u2022 ${textoTramo(t)}`).join("\n")}`);
  const sol = bloqueSol(d);
  if (sol) bloques.push(sol);
  bloques.push([
    `\u{1F4A8} <b>Viento</b> ${num0(primera?.viento ?? d.vientoMax)} km/h del ${brujula(primera?.dir ?? d.dir)}`,
    `     hoy hasta ${num0(d.vientoMax)} \xB7 rachas ${num0(d.rachaMax)} km/h`,
    `\u{1F4A7} <b>Humedad</b> ${primera?.humedad ?? "\u2013"} %`,
    `\u{1F576} <b>UV m\xE1x.</b> ${num1(d.uvMax)} (${nivelUv(d.uvMax)})${d.uvMax >= 3 ? " \u2014 protecci\xF3n solar" : ""}`
  ].join("\n"));
  const f = faseDelDia(p.y, p.m, p.d, zona);
  bloques.push(`${f.emoji} <b>${f.nombre}</b>
${Math.round(iluminacion(p.y, p.m, p.d, zona) * 100)} % iluminada`);
  if (d.lluviaAyer !== void 0 && d.lluviaAnio !== void 0) {
    bloques.push(`\u{1F327} <b>Lluvia ca\xEDda</b>
Ayer ${d.lluviaAyer >= 0.1 ? `llovi\xF3 ${num1(d.lluviaAyer)} l/m\xB2` : "no llovi\xF3"}
Acumulado ${d.anio}: ${num1(d.lluviaAnio)} l/m\xB2`);
  }
  return bloques.join("\n\n");
}
__name(renderTiempo, "renderTiempo");
function renderHoraAHora(d, ciudad) {
  const filas = d.horas.map((h) => `${hh(h.hora)}:00 ${emojiTiempo(h.codigo)} <b>${grados(h.temp)}</b> \xB7 \u{1F4A7}${h.prob} % \xB7 \u{1F4A8}${num0(h.viento)} \xB7 \u{1F32B}${h.humedad} %`);
  return [cabecera("\u{1F550}", `Hora a hora \xB7 ${esc(ciudad)}`, "\u{1F4A7} prob. lluvia \xB7 \u{1F4A8} viento km/h \xB7 \u{1F32B} humedad"), "", ...filas].join("\n");
}
__name(renderHoraAHora, "renderHoraAHora");
function renderLuna(ahora, zona) {
  const p = partesEnZona(ahora, zona);
  const hoy = faseDelDia(p.y, p.m, p.d, zona);
  const fmt = /* @__PURE__ */ __name((x) => formatearFechaHora(localAUtc(x.y, x.m, x.d, 12, 0, zona), zona).split(" \xB7 ")[0], "fmt");
  const llena = proximoDia(p.y, p.m, p.d, true, zona), nueva = proximoDia(p.y, p.m, p.d, false, zona);
  const mes = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: zona }).format(ahora);
  const dias = new Date(Date.UTC(p.y, p.m, 0)).getUTCDate();
  const primerDow = (new Date(Date.UTC(p.y, p.m - 1, 1)).getUTCDay() + 6) % 7;
  const semanas = [];
  for (let ini = 1 - primerDow; ini <= dias; ini += 7) {
    const celdas = [];
    for (let d = Math.max(ini, 1); d <= Math.min(ini + 6, dias); d++) celdas.push(`${d === p.d ? `<b>${d}</b>` : d}${faseDelDia(p.y, p.m, d, zona).emoji}`);
    semanas.push(celdas.join("  "));
  }
  return [
    cabecera("\u{1F319}", `Calendario lunar \xB7 ${mes}`),
    "",
    `Hoy: ${hoy.emoji} ${hoy.nombre} \xB7 ${Math.round(iluminacion(p.y, p.m, p.d, zona) * 100)} % iluminada \xB7 ${Math.round(edadDias(p.y, p.m, p.d, zona))} d\xEDas`,
    `\u{1F315} Pr\xF3xima llena: ${fmt(llena)}`,
    `\u{1F311} Pr\xF3xima nueva: ${fmt(nueva)}`,
    "",
    "<i>Por semanas (lunes a domingo):</i>",
    ...semanas
  ].join("\n");
}
__name(renderLuna, "renderLuna");
var hora0 = /* @__PURE__ */ __name((zona, ahora) => {
  const p = partesEnZona(ahora, zona);
  return `${hh(p.h)}:${hh(p.mi)}`;
}, "hora0");
function panelResumen(d, ciudad, zona, ahora) {
  const p = partesEnZona(ahora, zona);
  const temps = d.horas.map((h) => h.temp), primera = d.horas[0], ultima = d.horas[d.horas.length - 1];
  const iMax = temps.length ? temps.indexOf(Math.max(...temps)) : 0, iMin = temps.length ? temps.indexOf(Math.min(...temps)) : 0;
  const luz = d.amanece && d.anochece ? minutos(d.anochece) - minutos(d.amanece) : 0;
  const f = faseDelDia(p.y, p.m, p.d, zona);
  const r = /* @__PURE__ */ __name((n) => Math.round(n), "r");
  return {
    vista: "resumen",
    ciudad,
    actualizado: hora0(zona, ahora),
    resumen: {
      emoji: emojiTiempo(d.codigo),
      desc: descTiempo(d.codigo).replace(/^./, (c) => c.toUpperCase()),
      temp: r(primera?.temp ?? (d.tMin + d.tMax) / 2),
      tMin: r(d.tMin),
      tMax: r(d.tMax),
      humedad: r(primera?.humedad ?? 0),
      viento: r(primera?.viento ?? d.vientoMax),
      dir: brujula(primera?.dir ?? d.dir),
      dirGrados: r(primera?.dir ?? d.dir),
      vientoMax: r(d.vientoMax),
      rachaMax: r(d.rachaMax),
      uv: Math.round(d.uvMax * 10) / 10,
      uvNivel: nivelUv(d.uvMax),
      amanece: d.amanece,
      anochece: d.anochece,
      luz: luz > 0 ? `${Math.floor(luz / 60)} h ${luz % 60} min de luz` : "",
      horasDesde: primera?.hora ?? p.h,
      horasHasta: ultima?.hora ?? p.h,
      maxima: { v: r(temps[iMax] ?? d.tMax), hora: d.horas[iMax]?.hora ?? 0 },
      minima: { v: r(temps[iMin] ?? d.tMin), hora: d.horas[iMin]?.hora ?? 0 },
      lluvia: { horas: d.horas.length, tramos: tramosLluvia(d.horas).map((t) => ({ desde: t.desde, hasta: t.hasta, mm: Math.round(t.mm * 10) / 10, prob: t.probMax })) },
      luna: { emoji: f.emoji, nombre: f.nombre, iluminada: Math.round(iluminacion(p.y, p.m, p.d, zona) * 100) },
      ...d.lluviaAyer !== void 0 && d.lluviaAnio !== void 0 ? { caida: { ayer: Math.round(d.lluviaAyer * 10) / 10, anio: d.anio, total: Math.round(d.lluviaAnio * 10) / 10 } } : {}
    }
  };
}
__name(panelResumen, "panelResumen");
function panelHoras(d, ciudad, zona, ahora) {
  return { vista: "horas", ciudad, actualizado: hora0(zona, ahora), horas: d.horas.map((h) => ({ hora: h.hora, emoji: emojiTiempo(h.codigo), desc: descTiempo(h.codigo), temp: Math.round(h.temp), prob: Math.round(h.prob), mm: Math.round(h.mm * 10) / 10, viento: Math.round(h.viento), humedad: Math.round(h.humedad) })) };
}
__name(panelHoras, "panelHoras");
function panelLuna(ciudad, ahora, zona) {
  const p = partesEnZona(ahora, zona);
  const hoy = faseDelDia(p.y, p.m, p.d, zona);
  const fmt = /* @__PURE__ */ __name((x) => formatearFechaHora(localAUtc(x.y, x.m, x.d, 12, 0, zona), zona).split(" \xB7 ")[0], "fmt");
  const llena = proximoDia(p.y, p.m, p.d, true, zona), nueva = proximoDia(p.y, p.m, p.d, false, zona);
  const mes = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: zona }).format(ahora);
  const dias = new Date(Date.UTC(p.y, p.m, 0)).getUTCDate();
  const primerDow = (new Date(Date.UTC(p.y, p.m - 1, 1)).getUTCDay() + 6) % 7;
  const semanas = [];
  for (let ini = 1 - primerDow; ini <= dias; ini += 7) semanas.push(Array.from({ length: 7 }, (_, i) => {
    const d = ini + i;
    return d >= 1 && d <= dias ? { d, emoji: faseDelDia(p.y, p.m, d, zona).emoji } : null;
  }));
  return { vista: "luna", ciudad, actualizado: hora0(zona, ahora), luna: { mes, hoy: { emoji: hoy.emoji, nombre: hoy.nombre, iluminada: Math.round(iluminacion(p.y, p.m, p.d, zona) * 100), dias: Math.round(edadDias(p.y, p.m, p.d, zona)), dia: p.d }, llena: fmt(llena), nueva: fmt(nueva), semanas } };
}
__name(panelLuna, "panelLuna");
async function pedirPrevision(ctx) {
  const { usuario: u, ahora } = ctx;
  const c = u.ciudad;
  const clave = `tiempo:${c.lat.toFixed(2)},${c.lon.toFixed(2)}:${u.zona}:${fechaIso(ahora, u.zona)}T${partesEnZona(ahora, u.zona).h}`;
  return cacheado(ctx.almacen, clave, 45 * 6e4, ahora, async () => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,uv_index,wind_gusts_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,uv_index_max,shortwave_radiation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=${encodeURIComponent(u.zona)}&forecast_days=2`;
    const pasada = (async () => {
      const p = partesEnZona(ahora, u.zona);
      const ayer = new Date(Date.UTC(p.y, p.m - 1, p.d - 1));
      if (ayer.getUTCFullYear() !== p.y) return null;
      const iso = ayer.toISOString().slice(0, 10);
      const h = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&start_date=${p.y}-01-01&end_date=${iso}&daily=precipitation_sum&timezone=${encodeURIComponent(u.zona)}`;
      const arr = (await conReintentos(() => ctx.http.get(h, { timeout: 2e4 }))).data.daily.precipitation_sum;
      return arr.map((x) => x ?? 0);
    })().catch(() => null);
    const [prev, v] = await Promise.all([conReintentos(() => ctx.http.get(url, { timeout: 2e4 })), pasada]);
    const datos = parsearPrevision(prev.data, ahora, u.zona);
    if (v) {
      datos.lluviaAyer = v[v.length - 1] ?? 0;
      datos.lluviaAnio = v.reduce((a, b) => a + b, 0);
    }
    return datos;
  });
}
__name(pedirPrevision, "pedirPrevision");
async function contenidoTiempo(ctx) {
  if (!ctx.usuario.ciudad) {
    return { html: "\u{1F324} <b>Tiempo</b>\nPara darte el tiempo necesito saber d\xF3nde vives.", acciones: [{ texto: "\u{1F4CD} Indicar mi ciudad", ir: "perfil" }] };
  }
  const d = await pedirPrevision(ctx);
  return {
    html: renderTiempo(d, ctx.usuario.ciudad.nombre, ctx.usuario.zona, ctx.ahora),
    tiempo: panelResumen(d, ctx.usuario.ciudad.nombre, ctx.usuario.zona, ctx.ahora),
    acciones: [{ texto: "\u{1F550} Hora a hora", ref: "tiempo:horas" }, { texto: "\u{1F319} Calendario lunar", ref: "tiempo:luna" }]
  };
}
__name(contenidoTiempo, "contenidoTiempo");
async function contenidoHoraAHora(ctx) {
  if (!ctx.usuario.ciudad) return contenidoTiempo(ctx);
  const d = await pedirPrevision(ctx);
  return { html: renderHoraAHora(d, ctx.usuario.ciudad.nombre), tiempo: panelHoras(d, ctx.usuario.ciudad.nombre, ctx.usuario.zona, ctx.ahora), acciones: [{ texto: "\u2B05\uFE0F Resumen", ref: "tiempo" }] };
}
__name(contenidoHoraAHora, "contenidoHoraAHora");
async function contenidoLuna(ctx) {
  return { html: renderLuna(ctx.ahora, ctx.usuario.zona), tiempo: panelLuna(ctx.usuario.ciudad?.nombre ?? "", ctx.ahora, ctx.usuario.zona), acciones: [{ texto: "\u2B05\uFE0F Resumen del tiempo", ref: "tiempo" }] };
}
__name(contenidoLuna, "contenidoLuna");

// ../firebase/functions/src/webpush.ts
var enc = new TextEncoder();
var subtle = /* @__PURE__ */ __name(() => globalThis.crypto.subtle, "subtle");
var b64u = /* @__PURE__ */ __name((b) => {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = "";
  for (const x of u) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}, "b64u");
var deB64u = /* @__PURE__ */ __name((s) => {
  const t = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4));
  return Uint8Array.from(t, (c) => c.charCodeAt(0));
}, "deB64u");
var concat = /* @__PURE__ */ __name((...p) => {
  const r = new Uint8Array(p.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of p) {
    r.set(x, o);
    o += x.length;
  }
  return r;
}, "concat");
async function hkdf(ikm, salt, info, bytes) {
  const k = await subtle().importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await subtle().deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, bytes * 8));
}
__name(hkdf, "hkdf");
async function cifrarPush(mensaje, p256dh, auth, alAzar) {
  const uaPublica = deB64u(p256dh), secretoAuth = deB64u(auth);
  const efimera = alAzar?.claves ?? await subtle().generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPublica = new Uint8Array(await subtle().exportKey("raw", efimera.publicKey));
  const uaClave = await subtle().importKey("raw", uaPublica, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const compartido = new Uint8Array(await subtle().deriveBits({ name: "ECDH", public: uaClave }, efimera.privateKey, 256));
  const ikm = await hkdf(compartido, secretoAuth, concat(enc.encode("WebPush: info\0"), uaPublica, asPublica), 32);
  const salt = alAzar?.salt ?? globalThis.crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(ikm, salt, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(ikm, salt, enc.encode("Content-Encoding: nonce\0"), 12);
  const relleno = concat(enc.encode(mensaje), Uint8Array.of(2));
  const clave = await subtle().importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cifrado = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv: nonce }, clave, relleno));
  return concat(salt, Uint8Array.of(0, 0, 16, 0), Uint8Array.of(asPublica.length), asPublica, cifrado);
}
__name(cifrarPush, "cifrarPush");
var CLAVE_VAPID = "vapid:claves";
var DIEZ_ANYOS_MS = 3650 * 24 * 36e5;
async function claveVapid(almacen, ahora) {
  const guardada = await almacen.cacheGet(CLAVE_VAPID, ahora);
  if (guardada) {
    try {
      return JSON.parse(guardada);
    } catch {
    }
  }
  const par = await subtle().generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const c = { publica: b64u(await subtle().exportKey("raw", par.publicKey)), privada: await subtle().exportKey("jwk", par.privateKey) };
  await almacen.cacheSet(CLAVE_VAPID, JSON.stringify(c), DIEZ_ANYOS_MS, ahora);
  return c;
}
__name(claveVapid, "claveVapid");
async function cabeceraVapid(endpoint, c, ahora, contacto = "mailto:admin@agenda.invalid") {
  const cuerpo = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(ahora.getTime() / 1e3) + 12 * 3600, sub: contacto })));
  const dato = `${b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })))}.${cuerpo}`;
  const clave = await subtle().importKey("jwk", c.privada, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const firma = new Uint8Array(await subtle().sign({ name: "ECDSA", hash: "SHA-256" }, clave, enc.encode(dato)));
  return `vapid t=${dato}.${b64u(firma)}, k=${c.publica}`;
}
__name(cabeceraVapid, "cabeceraVapid");
function crearEmisorPush(almacen, ahora, post, log = () => void 0) {
  return async (s, aviso) => {
    try {
      const vapid = await claveVapid(almacen, ahora());
      const cuerpo = await cifrarPush(JSON.stringify(aviso), s.p256dh, s.auth);
      const estado2 = await post(s.endpoint, {
        authorization: await cabeceraVapid(s.endpoint, vapid, ahora()),
        "content-encoding": "aes128gcm",
        "content-type": "application/octet-stream",
        ttl: "86400",
        urgency: "normal"
      }, cuerpo);
      if (estado2 >= 200 && estado2 < 300) return "ok";
      log(`push ${new URL(s.endpoint).host}: respuesta ${estado2}`);
      return estado2 === 404 || estado2 === 410 ? "caducada" : "error";
    } catch (e) {
      log(`push ${s.dispositivo}: ${e.message}`);
      return "error";
    }
  };
}
__name(crearEmisorPush, "crearEmisorPush");
function textoPlano(html, max = 110) {
  const t = html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/[▬─━]+/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "\u2026" : t;
}
__name(textoPlano, "textoPlano");
function suscripcionValida(v) {
  if (!v || typeof v.endpoint !== "string" || v.endpoint.length > 600 || !/^https:\/\//.test(v.endpoint)) return false;
  try {
    return deB64u(String(v.p256dh)).length === 65 && deB64u(String(v.auth)).length === 16;
  } catch {
    return false;
  }
}
__name(suscripcionValida, "suscripcionValida");

// ../firebase/functions/src/resumen.ts
var VIGENCIA_MS = 36 * 36e5;
var claveP = /* @__PURE__ */ __name((uid, fecha, ref) => `rp:${uid}:${fecha}:${ref}`, "claveP");
var claveC = /* @__PURE__ */ __name((uid, fecha, ref) => `rc:${uid}:${fecha}:${ref}`, "claveC");
var esSeccion = /* @__PURE__ */ __name((ref) => !ref.includes(":") || ref.startsWith("tema:"), "esSeccion");
async function guardarResumen(ctx, ref, c) {
  if (!esSeccion(ref)) return;
  const u = ctx.usuario, fecha = fechaIso(ctx.ahora, u.zona), hora2 = ctx.ahora.toISOString();
  const t = c.tiempo?.resumen;
  const previa = t ? `${c.tiempo.ciudad} \xB7 ${t.temp}\xB0 \xB7 ${t.desc} (m\xEDn ${t.tMin}\xB0 / m\xE1x ${t.tMax}\xB0)` : c.grupos?.[0]?.noticias[0]?.titulo ?? textoPlano(c.html, 150);
  await ctx.almacen.cacheSet(claveP(u.id, fecha, ref), JSON.stringify({ hora: hora2, previa }), VIGENCIA_MS, ctx.ahora);
  await ctx.almacen.cacheSet(claveC(u.id, fecha, ref), JSON.stringify({ html: c.html, acciones: c.acciones, grupos: c.grupos, tiempo: c.tiempo, hora: hora2 }), VIGENCIA_MS, ctx.ahora);
}
__name(guardarResumen, "guardarResumen");
async function resumenesDeHoy(almacen, u, ahora) {
  const fecha = fechaIso(ahora, u.zona);
  const refs = [...ORDEN_SECCIONES.map(String), ...u.temas.map((t) => `tema:${t.id}`)];
  const r = await almacen.cacheGetVarios(refs.map((x) => claveP(u.id, fecha, x)), ahora);
  const res = [];
  for (const ref of refs) {
    const v = r[claveP(u.id, fecha, ref)];
    if (!v) continue;
    try {
      const p = JSON.parse(v);
      res.push({ ref, hora: p.hora, previa: p.previa });
    } catch {
    }
  }
  return res;
}
__name(resumenesDeHoy, "resumenesDeHoy");
async function leerResumen(almacen, u, ref, ahora) {
  const v = esSeccion(ref) ? await almacen.cacheGet(claveC(u.id, fechaIso(ahora, u.zona), ref), ahora) : null;
  try {
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}
__name(leerResumen, "leerResumen");
var horaLocal = /* @__PURE__ */ __name((iso, zona) => {
  const p = partesEnZona(new Date(iso), zona);
  return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}, "horaLocal");

// ../firebase/functions/src/secciones/index.ts
async function construirContenido(id, ctx) {
  const c = await construir(id, ctx);
  try {
    await guardarResumen(ctx, id, c);
  } catch {
  }
  return c;
}
__name(construirContenido, "construirContenido");
async function construir(id, ctx) {
  switch (id) {
    case "tiempo":
      return contenidoTiempo(ctx);
    case "tiempo:horas":
      return contenidoHoraAHora(ctx);
    case "tiempo:luna":
      return contenidoLuna(ctx);
    case "noticias":
      return contenidoNoticias(ctx);
    case "agenda":
      return contenidoAgenda(ctx);
    case "horoscopo":
      return contenidoHoroscopo(ctx);
    case "mercados":
      return contenidoMercados(ctx);
    default:
      if (id.startsWith("tema:")) return contenidoTema(ctx, id.slice(5));
      throw new Error(`secci\xF3n desconocida: ${id}`);
  }
}
__name(construir, "construir");

// ../firebase/functions/src/contenido.ts
var contenidoDeSeccion = /* @__PURE__ */ __name((deps, usuario, ref) => construirContenido(ref, { usuario, http: deps.http, almacen: deps.almacen, ahora: deps.ahora(), horoscopoCfg: deps.horoscopoCfg, podcastFeed: deps.podcastFeed }), "contenidoDeSeccion");

// ../firebase/functions/src/geocoding.ts
async function buscarLugares(http, consulta) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(consulta.trim())}&count=5&language=es&format=json`;
  const r = await conReintentos(() => http.get(url, { timeout: 15e3 }), 2, 800);
  const res = r.data?.results ?? [];
  return res.filter((x) => typeof x.latitude === "number" && typeof x.longitude === "number").map((x) => {
    const provincia = String(x.admin2 ?? "").replace(/^Provincia de /, "") || String(x.admin1 ?? "");
    return {
      nombre: String(x.name),
      provincia,
      lat: x.latitude,
      lon: x.longitude,
      zona: String(x.timezone ?? "Europe/Madrid"),
      etiqueta: [x.name, x.admin2, x.admin1, x.country].filter(Boolean).join(", ")
    };
  });
}
__name(buscarLugares, "buscarLugares");

// ../firebase/functions/src/avatares.ts
var AVATARES = [
  "\u{1F98A}",
  "\u{1F43C}",
  "\u{1F428}",
  "\u{1F981}",
  "\u{1F42F}",
  "\u{1F438}",
  "\u{1F435}",
  "\u{1F427}",
  "\u{1F989}",
  "\u{1F984}",
  "\u{1F419}",
  "\u{1F98B}",
  "\u{1F422}",
  "\u{1F42C}",
  "\u{1F988}",
  "\u{1F433}",
  "\u{1F996}",
  "\u{1F41D}",
  "\u{1F41E}",
  "\u{1F994}",
  "\u{1F430}",
  "\u{1F43B}",
  "\u{1F436}",
  "\u{1F431}",
  "\u{1F439}",
  "\u{1F992}",
  "\u{1F993}",
  "\u{1F998}",
  "\u{1F99C}",
  "\u{1F9A9}",
  "\u{1F43A}",
  "\u{1F99D}",
  "\u{1F42E}",
  "\u{1F437}",
  "\u{1F434}",
  "\u{1F98C}",
  "\u{1F9A6}",
  "\u{1F9A5}",
  "\u{1F40A}",
  "\u{1F985}",
  "\u{1F335}",
  "\u{1F33B}",
  "\u{1F338}",
  "\u{1F340}",
  "\u{1F344}",
  "\u{1F308}",
  "\u2B50",
  "\u{1F319}",
  "\u2600\uFE0F",
  "\u{1F525}",
  "\u26A1",
  "\u2744\uFE0F",
  "\u{1F30A}",
  "\u{1F34E}",
  "\u{1F353}",
  "\u{1F34B}",
  "\u{1F951}",
  "\u{1F355}",
  "\u{1F369}",
  "\u2615",
  "\u{1F3B8}",
  "\u{1F3A7}",
  "\u{1F3AE}",
  "\u{1F3A8}",
  "\u{1F4DA}",
  "\u{1F680}",
  "\u26BD",
  "\u{1F3C0}",
  "\u{1F6B2}",
  "\u26F5",
  "\u{1F3D4}\uFE0F",
  "\u{1F3AF}",
  "\u{1F9E9}",
  "\u{1FA81}",
  "\u{1F3AD}",
  "\u{1F916}",
  "\u{1F47D}",
  "\u{1F47B}",
  "\u{1F9D9}",
  "\u{1F9B8}"
];
var NUM_COLORES = 8;
function avatarEmoji(emoji, color) {
  const e = AVATARES.find((x) => x === emoji);
  const c = Number(color);
  return e && Number.isInteger(c) && c >= 0 && c < NUM_COLORES ? { tipo: "emoji", emoji: e, color: c } : null;
}
__name(avatarEmoji, "avatarEmoji");
var fotoValida = /* @__PURE__ */ __name((v) => typeof v === "string" && v.length <= 7e4 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v), "fotoValida");
var claveFoto = /* @__PURE__ */ __name((uid) => `avatar:${uid}`, "claveFoto");
var VIGENCIA_FOTO_MS = 3650 * 24 * 36e5;

// ../firebase/functions/src/almacen.ts
function idProgramacion(uid, tipo, ref) {
  return `${uid}__${tipo}__${ref}`.replace(/\//g, "_");
}
__name(idProgramacion, "idProgramacion");

// ../firebase/functions/src/programar.ts
async function programarSeccion(almacen, u, ref, ahora) {
  const id = idProgramacion(u.id, "seccion", ref);
  const cfg = ref.startsWith("tema:") ? u.temas.find((t) => `tema:${t.id}` === ref) : u.secciones[ref];
  if (!cfg || !cfg.activa) {
    await almacen.borrarProgramacion(id);
    return;
  }
  await almacen.guardarProgramacion({ id, uid: u.id, tipo: "seccion", ref, proximo: proximaOcurrencia(cfg.hora, u.zona, ahora) });
}
__name(programarSeccion, "programarSeccion");
async function sincronizarSecciones(almacen, u, ahora) {
  await almacen.borrarProgramacionesDe(u.id, "seccion");
  for (const s of ORDEN_SECCIONES) await programarSeccion(almacen, u, s, ahora);
  for (const t of u.temas) await programarSeccion(almacen, u, `tema:${t.id}`, ahora);
}
__name(sincronizarSecciones, "sincronizarSecciones");
function adelantarRepeticion(e, zona, ahora) {
  let f = e.fechaHora;
  if (!f || e.repeticion === "ninguna") return e;
  let guard = 0;
  while (f && momentoAviso({ ...e, fechaHora: f }).getTime() <= ahora.getTime() && guard++ < 800) f = siguienteRepeticion(f, e.repeticion, zona);
  return f ? { ...e, fechaHora: f } : e;
}
__name(adelantarRepeticion, "adelantarRepeticion");
async function programarEvento(almacen, e, zona, ahora) {
  const id = idProgramacion(e.uid, "evento", e.id);
  let ev = adelantarRepeticion(e, zona, ahora);
  const aviso = momentoAviso(ev);
  if (!aviso || ev.hecho || ev.avisado && ev.repeticion === "ninguna" || aviso.getTime() <= ahora.getTime()) {
    await almacen.borrarProgramacion(id);
    return ev;
  }
  if (ev.avisado) ev = { ...ev, avisado: false };
  await almacen.guardarProgramacion({ id, uid: ev.uid, tipo: "evento", ref: ev.id, proximo: aviso });
  return ev;
}
__name(programarEvento, "programarEvento");
var idPosponer = /* @__PURE__ */ __name((uid, eventoId) => idProgramacion(uid, "evento", `posponer_${eventoId}`), "idPosponer");
async function cancelarEvento(almacen, uid, eventoId) {
  await almacen.borrarProgramacion(idProgramacion(uid, "evento", eventoId));
  await almacen.borrarProgramacion(idPosponer(uid, eventoId));
  await almacen.borrarEvento(uid, eventoId);
}
__name(cancelarEvento, "cancelarEvento");

// ../firebase/functions/src/fotoCiudad.ts
var CABECERAS2 = { "User-Agent": "Nexora/1.0 (agenda personal; contacto: admin@agenda.invalid)", Accept: "application/json" };
var NO_FOTO = /escudo|bandera|flag|coat[_ ]of|mapa|map[_ .-]|locator|logo|sello|firma|plano|situaci[oó]n|ubicaci[oó]n|location|blason|seal|icon|\.svg|\.png|\.gif|\.webm|\.ogv/i;
var API = "https://es.wikipedia.org/api/rest_v1/page";
var TREINTA_DIAS = 30 * 24 * 36e5;
var TRES_DIAS = 3 * 24 * 36e5;
var ampliar = /* @__PURE__ */ __name((src) => {
  const u = src.startsWith("//") ? `https:${src}` : src;
  return /^https:\/\/upload\.wikimedia\.org\//.test(u) ? u.replace(/\/\d+px-/, "/800px-") : "";
}, "ampliar");
async function buscar(http, titulo) {
  const t = encodeURIComponent(titulo.replace(/ /g, "_"));
  const resumen = (await http.get(`${API}/summary/${t}`, { timeout: 5e3, headers: CABECERAS2 })).data ?? {};
  if (!resumen || resumen.type !== "standard") return "";
  const lista = (await http.get(`${API}/media-list/${t}`, { timeout: 5e3, headers: CABECERAS2, maxBytes: 2e5 }).catch(() => ({ data: {} }))).data ?? {};
  const mini = String(resumen.thumbnail?.source ?? "");
  if (mini && !NO_FOTO.test(decodeURIComponent(mini.split("/").pop() ?? "")) && /\.jpe?g/i.test(mini)) return ampliar(mini);
  const tituloCiudad = titulo.toLowerCase();
  const candidatas = (lista.items ?? []).filter((it) => it.type === "image" && /\.jpe?g$|\.webp$/i.test(String(it.title ?? "")) && !NO_FOTO.test(String(it.title ?? ""))).map((it) => {
    const titulo2 = String(it.title ?? "").toLowerCase();
    const src = ampliar(String(it.srcset?.[0]?.src ?? ""));
    if (!src) return null;
    let puntos = 0;
    if (titulo2.includes(tituloCiudad)) puntos += 8;
    if (/city|ciudad|centro|centre|plaza|square|calle|street|avenida|avenue|puente|bridge|castillo|castle|iglesia|church|catedral|cathedral|ayuntamiento|town hall|monument|monumento|panoram/.test(titulo2)) puntos += 5;
    if (/mountain|montana|montaña|paisaje|landscape|nature|naturaleza|forest|bosque/.test(titulo2)) puntos -= 4;
    return { src, puntos };
  }).filter(Boolean);
  candidatas.sort((a, b) => b.puntos - a.puntos);
  if (candidatas[0]) return candidatas[0].src;
  return "";
}
__name(buscar, "buscar");
async function fotoCiudad(http, almacen, ahora, nombre, provincia) {
  const clave = `foto:${nombre}|${provincia}`.toLowerCase();
  const guardada = await almacen.cacheGet(clave, ahora).catch(() => null);
  if (guardada !== null) return guardada;
  let url = "";
  const titulos = [...new Set([nombre, provincia && provincia.toLowerCase() !== nombre.toLowerCase() ? `${nombre} (${provincia})` : ""].filter(Boolean))];
  for (const t of titulos) {
    try {
      url = await buscar(http, t);
    } catch {
    }
    if (url) break;
  }
  await almacen.cacheSet(clave, url, url ? TREINTA_DIAS : TRES_DIAS, ahora).catch(() => void 0);
  return url;
}
__name(fotoCiudad, "fotoCiudad");

// ../firebase/functions/src/api.ts
var ok = /* @__PURE__ */ __name((cuerpo = { ok: true }) => ({ estado: 200, cuerpo }), "ok");
var error = /* @__PURE__ */ __name((estado2, mensaje) => ({ estado: estado2, cuerpo: { error: mensaje } }), "error");
var TIPOS = ["alarma", "cita", "tarea", "mensaje", "nota"];
var REPS = ["ninguna", "diaria", "semanal", "laborables", "anual"];
var economiaNormalizada = /* @__PURE__ */ __name((u) => u.economia ?? { movimientos: [], facturas: [], presupuestoMensual: null, objetivos: [] }, "economiaNormalizada");
var saludNormalizada = /* @__PURE__ */ __name((u) => u.salud ?? { peso: [], entrenamientos: [], planes: [] }, "saludNormalizada");
var idEconomia = /* @__PURE__ */ __name(() => crypto.randomUUID().replace(/-/g, "").slice(0, 12), "idEconomia");
var eventoJson = /* @__PURE__ */ __name((e, u, ahora) => ({
  id: e.id,
  tipo: e.tipo,
  titulo: e.titulo,
  lugar: e.lugar,
  hecho: e.hecho,
  repeticion: e.repeticion,
  antelacionMin: e.antelacionMin,
  ...e.mensaje ? { mensaje: e.mensaje, enlaceWa: enlaceWhatsApp(e.mensaje) } : {},
  ...e.nota ? { nota: e.nota } : {},
  ...e.subtareas ? { subtareas: e.subtareas } : {},
  cuando: e.fechaHora ? e.fechaHora.toISOString() : null,
  texto: e.fechaHora ? formatearFechaHora(e.fechaHora, u.zona, ahora) : "sin fecha"
}), "eventoJson");
async function estado(deps, u) {
  const ahora = deps.ahora();
  const eventos = (await deps.almacen.listarEventos(u.id)).sort((a, b) => (a.fechaHora?.getTime() ?? Infinity) - (b.fechaHora?.getTime() ?? Infinity)).slice(0, 100);
  const secciones = [
    ...ORDEN_SECCIONES.map((s) => ({ ref: s, emoji: SECCIONES[s].emoji, titulo: SECCIONES[s].titulo, descripcion: SECCIONES[s].descripcion, activa: u.secciones[s].activa, hora: u.secciones[s].hora, oculta: !!u.secciones[s].oculta })),
    ...u.temas.map((t) => ({ ref: `tema:${t.id}`, emoji: t.emoji, titulo: t.titulo, descripcion: `Noticias sobre \xAB${t.consulta}\xBB`, activa: t.activa, hora: t.hora }))
  ];
  return ok({
    usuario: { nombre: u.nombre, nacimiento: u.nacimiento, estilo: u.estilo, modo: u.modo, ciudad: u.ciudad?.nombre ?? null, zona: u.zona, sol: textoSol(u, ahora) },
    avatar: u.avatar,
    fotoAvatar: u.avatar?.tipo === "foto" ? await deps.almacen.cacheGet(claveFoto(u.id), ahora) : null,
    avatares: AVATARES,
    notificaciones: { sonido: u.notificaciones.sonido, dispositivos: u.notificaciones.suscripciones.map((x) => ({ id: x.endpoint.slice(-24), nombre: x.dispositivo, desde: x.desde })) },
    economia: economiaNormalizada(u),
    salud: saludNormalizada(u),
    resumenHoy: (await resumenesDeHoy(deps.almacen, u, ahora)).map((r) => {
      const info = r.ref.startsWith("tema:") ? u.temas.find((t) => `tema:${t.id}` === r.ref) : SECCIONES[r.ref];
      return { ref: r.ref, emoji: info?.emoji ?? "\u{1F4EC}", titulo: info?.titulo ?? r.ref, hora: horaLocal(r.hora, u.zona), previa: r.previa };
    }),
    compra: u.compra,
    secciones,
    eventos: eventos.map((e) => eventoJson(e, u, ahora)),
    ahora: ahora.toISOString()
  });
}
__name(estado, "estado");
var refsActivas = /* @__PURE__ */ __name((u) => ORDEN_SECCIONES.filter((x) => u.secciones[x].activa).map(String).concat(u.temas.filter((t) => t.activa).map((t) => `tema:${t.id}`)), "refsActivas");
var VIGENCIA_LISTA_MS = 120 * 24 * 36e5;
var claveLista = /* @__PURE__ */ __name((token) => `lista:${token}`, "claveLista");
var tokenNuevo = /* @__PURE__ */ __name(() => Array.from(globalThis.crypto.getRandomValues(new Uint8Array(18)), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join(""), "tokenNuevo");
var enlaceLista = /* @__PURE__ */ __name((deps, token) => `${(deps.urlBase ?? "").replace(/\/+$/, "")}/lista/?t=${token}`, "enlaceLista");
function editarCompra(l, c, ahora, propietario) {
  const id = /* @__PURE__ */ __name(() => globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 10), "id");
  switch (c.accion) {
    case "anadir": {
      const nuevos = String(c.texto ?? "").split(/[\n,;]+/).map((t) => t.trim().slice(0, 60)).filter(Boolean);
      if (!nuevos.length) return error(400, "Escribe lo que quieres comprar");
      if (l.items.length + nuevos.length > 150) return error(409, "La lista es demasiado larga: termina la compra primero");
      for (const t of nuevos) l.items.push({ id: id(), texto: t, hecho: false });
      return null;
    }
    case "marcar": {
      const a = l.items.find((x) => x.id === c.id);
      if (!a) return error(404, "Ya no est\xE1 en la lista");
      a.hecho = !a.hecho;
      return null;
    }
    case "quitar":
      l.items = l.items.filter((x) => x.id !== c.id);
      return null;
  }
  if (!propietario) return error(403, "No permitido");
  switch (c.accion) {
    case "terminar": {
      const comprados = l.items.filter((x) => x.hecho);
      if (!comprados.length) return error(409, "Marca primero lo que has comprado");
      if (c.guardar) l.historial.unshift({ id: id(), fecha: ahora.toISOString(), items: comprados.map((x) => x.texto) });
      l.items = l.items.filter((x) => !x.hecho);
      l.historial = l.historial.slice(0, 30);
      return null;
    }
    case "vaciar":
      l.items = [];
      return null;
    case "olvidar":
      l.historial = l.historial.filter((x) => x.id !== c.id);
      return null;
    case "repetir": {
      const h = l.historial.find((x) => x.id === c.id);
      if (!h) return error(404, "Esa compra ya no est\xE1");
      for (const t of h.items) if (!l.items.some((x) => !x.hecho && x.texto.toLowerCase() === t.toLowerCase())) l.items.push({ id: id(), texto: t, hecho: false });
      return null;
    }
    default:
      return error(400, "Acci\xF3n desconocida");
  }
}
__name(editarCompra, "editarCompra");
async function manejarListaPublica(deps, c) {
  const token = String(c.token ?? "");
  if (!/^[a-z2-9]{18}$/.test(token)) return error(404, "Esta lista ya no est\xE1 disponible");
  const ahora = deps.ahora();
  const uid = await deps.almacen.cacheGet(claveLista(token), ahora);
  const u = uid ? await deps.almacen.getUsuario(uid) : null;
  if (!u || u.compra.token !== token) return error(404, "Esta lista ya no est\xE1 disponible");
  if (c.accion && c.accion !== "estado") {
    const fallo = editarCompra(u.compra, c, ahora, false);
    if (fallo) return fallo;
    await deps.almacen.guardarUsuario(u);
  }
  return ok({ propietario: u.nombre, items: u.compra.items, estilo: u.estilo });
}
__name(manejarListaPublica, "manejarListaPublica");
function fechaLocal(texto, zona) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/.exec(String(texto ?? ""));
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  return localAUtc(y, mo, d, h, mi, zona);
}
__name(fechaLocal, "fechaLocal");
async function manejarApi(deps, u, ruta, c) {
  const ahora = deps.ahora();
  switch (ruta) {
    case "/api/estado":
      return estado(deps, u);
    case "/api/apariencia": {
      if (c.estilo === "formal" || c.estilo === "informal") u.estilo = c.estilo;
      if (c.modo === "claro" || c.modo === "oscuro" || c.modo === "auto") u.modo = c.modo;
      await deps.almacen.guardarUsuario(u);
      return ok();
    }
    case "/api/seccion": {
      const ref = String(c.ref ?? "");
      const cfg = ref.startsWith("tema:") ? u.temas.find((t) => `tema:${t.id}` === ref) : u.secciones[ref];
      if (!cfg) return error(404, "Esa secci\xF3n no existe");
      if (typeof c.activa === "boolean") {
        if (c.activa && ref === "tiempo" && !u.ciudad) return error(409, "Para el tiempo necesito tu ciudad: elige tu ciudad en Mi perfil.");
        if (c.activa && ref === "horoscopo" && !u.nacimiento) return error(409, "Para el hor\xF3scopo necesito tu fecha de nacimiento: ponla en Mi perfil.");
        cfg.activa = c.activa;
      }
      if (typeof c.hora === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(c.hora)) cfg.hora = c.hora;
      if (typeof c.oculta === "boolean" && !ref.startsWith("tema:")) {
        cfg.oculta = c.oculta;
        if (c.oculta) cfg.activa = false;
      }
      await deps.almacen.guardarUsuario(u);
      await programarSeccion(deps.almacen, u, ref, ahora);
      return ok();
    }
    case "/api/salud": {
      const s = saludNormalizada(u);
      if (c.accion === "peso") {
        const kg = Number(c.kg), fecha = String(c.fecha);
        if (!Number.isFinite(kg) || kg < 20 || kg > 400 || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(fecha)) return error(400, "Peso o fecha no v\xE1lidos");
        s.peso.unshift({ id: idEconomia(), kg: Math.round(kg * 10) / 10, fecha });
        s.peso = s.peso.slice(0, 365);
      } else if (c.accion === "entrenamiento") {
        const titulo = String(c.titulo ?? "").trim().slice(0, 80), tipo = String(c.tipo ?? "").slice(0, 40), duracion = Number(c.duracion), fecha = String(c.fecha);
        if (!titulo || !Number.isFinite(duracion) || duracion < 1 || duracion > 600) return error(400, "Completa el entrenamiento");
        s.entrenamientos.unshift({ id: idEconomia(), titulo, tipo, duracion: Math.round(duracion), fecha });
        s.entrenamientos = s.entrenamientos.slice(0, 500);
      } else if (c.accion === "plan") {
        const titulo = String(c.titulo ?? "").trim().slice(0, 80), dias = String(c.dias ?? "").slice(0, 100), enfoque = String(c.enfoque ?? "").slice(0, 80), detalle = String(c.detalle ?? "").slice(0, 5e3), inicio = String(c.inicio ?? "").trim(), fin = String(c.fin ?? "").trim(), ejercicios = Array.isArray(c.ejercicios) ? c.ejercicios.map((x) => String(x).trim().slice(0, 100)).filter(Boolean).slice(0, 100) : [];
        if (!titulo) return error(400, "Indica el nombre del plan");
        if (inicio && !/^\\d{4}-\\d{2}-\\d{2}$/.test(inicio)) return error(400, "Fecha de inicio no v\xE1lida");
        if (fin && !/^\\d{4}-\\d{2}-\\d{2}$/.test(fin)) return error(400, "Fecha de finalizaci\xF3n no v\xE1lida");
        s.planes.unshift({ id: idEconomia(), titulo, dias, enfoque, detalle, inicio: inicio || void 0, fin: fin || void 0, ejercicios });
        s.planes = s.planes.slice(0, 30);
      } else return error(400, "Acci\xF3n de salud desconocida");
      u.salud = s;
      await deps.almacen.guardarUsuario(u);
      return ok({ salud: s });
    }
    case "/api/economia": {
      const ec = economiaNormalizada(u);
      if (c.accion === "movimiento") {
        const tipo = c.tipo === "ingreso" ? "ingreso" : c.tipo === "gasto" ? "gasto" : "";
        const importe = Number(c.importe), concepto = String(c.concepto ?? "").trim().slice(0, 100);
        if (!tipo || !concepto || !Number.isFinite(importe) || importe <= 0) return error(400, "Indica concepto, tipo e importe v\xE1lido");
        ec.movimientos.unshift({ id: idEconomia(), tipo, concepto, categoria: String(c.categoria ?? "Otros").trim().slice(0, 40) || "Otros", grupo: tipo === "gasto" ? c.grupo === "fijo" ? "fijo" : c.grupo === "ahorro" ? "ahorro" : "variable" : void 0, importe: Math.round(importe * 100) / 100, fecha: /^\d{4}-\d{2}-\d{2}$/.test(String(c.fecha)) ? String(c.fecha) : ahora.toISOString().slice(0, 10), recurrente: !!c.recurrente });
        ec.movimientos = ec.movimientos.slice(0, 1e3);
      } else if (c.accion === "movimiento_borrar") {
        const id = String(c.id ?? "");
        const antes = ec.movimientos.length;
        ec.movimientos = ec.movimientos.filter((m) => m.id !== id);
        if (ec.movimientos.length === antes) return error(404, "Movimiento no encontrado");
        if (Array.isArray(ec.historial)) {
          ec.historial = ec.historial.map((h) => {
            const ms = (h.movimientos || []).filter((m) => m.id !== id), ingresos = ms.filter((m) => m.tipo === "ingreso").reduce((a, m) => a + m.importe, 0), gastos = ms.filter((m) => m.tipo === "gasto").reduce((a, m) => a + m.importe, 0), fijos = ms.filter((m) => m.tipo === "gasto" && m.grupo === "fijo").reduce((a, m) => a + m.importe, 0), variables = ms.filter((m) => m.tipo === "gasto" && m.grupo !== "fijo").reduce((a, m) => a + m.importe, 0);
            return { ...h, movimientos: ms, ingresos, gastos, saldo: ingresos - gastos, gastosFijos: fijos, gastosVariables: variables };
          });
        }
      } else if (c.accion === "factura") {
        const importe = Number(c.importe), concepto = String(c.concepto ?? "").trim().slice(0, 100), vencimiento = String(c.vencimiento ?? "");
        if (!concepto || !Number.isFinite(importe) || importe <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(vencimiento)) return error(400, "Completa concepto, importe y vencimiento");
        ec.facturas.unshift({ id: idEconomia(), concepto, importe: Math.round(importe * 100) / 100, vencimiento, pagada: false });
        ec.facturas = ec.facturas.slice(0, 200);
      } else if (c.accion === "factura_pagar") {
        const f = ec.facturas.find((x) => x.id === String(c.id));
        if (!f) return error(404, "Factura no encontrada");
        if (!f.pagada) {
          f.pagada = true;
          ec.movimientos.unshift({ id: idEconomia(), tipo: "gasto", concepto: f.concepto, categoria: "Facturas", importe: f.importe, fecha: ahora.toISOString().slice(0, 10) });
        }
      } else if (c.accion === "factura_borrar") ec.facturas = ec.facturas.filter((x) => x.id !== String(c.id));
      else if (c.accion === "porcentajes") {
        const fijo = Number(c.fijo), variable = Number(c.variable), ahorro = Number(c.ahorro);
        if (![fijo, variable, ahorro].every((n) => Number.isFinite(n) && n >= 0 && n <= 100) || Math.round((fijo + variable + ahorro) * 100) / 100 !== 100) return error(400, "Los porcentajes deben sumar exactamente 100%.");
        ec.porcentajes = { fijo, variable, ahorro };
      } else if (c.accion === "archivar_mes") {
        const mes = String(c.mes ?? "");
        if (!/^\d{4}-\d{2}$/.test(mes)) return error(400, "Mes no v\xE1lido");
        if (!Array.isArray(ec.historial)) ec.historial = [];
        if (!ec.historial.some((x) => x.mes === mes)) {
          const ms = ec.movimientos.filter((m) => String(m.fecha).slice(0, 7) === mes), ingresos = ms.filter((m) => m.tipo === "ingreso").reduce((a, m) => a + m.importe, 0), gastos = ms.filter((m) => m.tipo === "gasto").reduce((a, m) => a + m.importe, 0), fijos = ms.filter((m) => m.tipo === "gasto" && m.grupo === "fijo").reduce((a, m) => a + m.importe, 0), variables = ms.filter((m) => m.tipo === "gasto" && m.grupo !== "fijo").reduce((a, m) => a + m.importe, 0);
          ec.historial.unshift({ mes, ingresos, gastos, saldo: ingresos - gastos, gastosFijos: fijos, gastosVariables: variables, objetivoAhorro: ingresos * (ec.porcentajes?.ahorro ?? 20) / 100, movimientos: ms });
          ec.historial = ec.historial.slice(0, 60);
        }
      } else if (c.accion === "presupuesto") {
        const n = Number(c.importe);
        if (!Number.isFinite(n) || n < 0) return error(400, "Presupuesto no v\xE1lido");
        ec.presupuestoMensual = Math.round(n * 100) / 100;
      } else if (c.accion === "objetivo") {
        const titulo = String(c.titulo ?? "").trim().slice(0, 100), importe = Number(c.importe), fechaObjetivo = String(c.fechaObjetivo ?? "");
        if (!titulo || !Number.isFinite(importe) || importe <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(fechaObjetivo)) return error(400, "Completa objetivo, importe y fecha");
        ec.objetivos.unshift({ id: idEconomia(), titulo, importe: Math.round(importe * 100) / 100, ahorrado: 0, fechaObjetivo });
        ec.objetivos = ec.objetivos.slice(0, 30);
      } else if (c.accion === "objetivo_aportar") {
        const o = ec.objetivos.find((x) => x.id === String(c.id)), n = Number(c.importe);
        if (!o || !Number.isFinite(n) || n <= 0) return error(400, "Aportaci\xF3n no v\xE1lida");
        o.ahorrado = Math.min(o.importe, Math.round((o.ahorrado + n) * 100) / 100);
      } else if (c.accion === "objetivo_borrar") ec.objetivos = ec.objetivos.filter((x) => x.id !== String(c.id));
      else return error(400, "Acci\xF3n econ\xF3mica desconocida");
      u.economia = ec;
      await deps.almacen.guardarUsuario(u);
      return ok({ economia: ec });
    }
    case "/api/evento": {
      const tipo = TIPOS.includes(c.tipo) ? c.tipo : null;
      let titulo = String(c.titulo ?? "").trim().slice(0, 80);
      let mensaje;
      if (tipo === "mensaje") {
        const texto = String(c.texto ?? "").trim().slice(0, 1e3), para = String(c.para ?? "").trim().slice(0, 40);
        const tel = String(c.telefono ?? "").trim() ? normalizarTelefono(String(c.telefono)) : "";
        if (!texto) return error(400, "Escribe el mensaje");
        if (tel === null) return error(400, "El tel\xE9fono no es v\xE1lido: ponlo con el prefijo del pa\xEDs, por ejemplo +34 600 000 000");
        mensaje = { para, telefono: tel, texto };
        if (!titulo) titulo = `Mensaje a ${para || "un contacto"}`;
      }
      let nota;
      if (tipo === "nota") {
        nota = String(c.texto ?? "").trim().slice(0, 4e3);
        if (!titulo) titulo = nota.split("\n")[0].slice(0, 80);
      }
      if (!tipo || !titulo) return error(400, "Falta el t\xEDtulo");
      const fecha = c.cuando ? fechaLocal(c.cuando, u.zona) : null;
      if (c.cuando && !fecha) return error(400, "La fecha no es v\xE1lida");
      if (tipo !== "tarea" && tipo !== "nota" && !fecha) return error(400, "Indica la fecha y la hora");
      if (fecha && fecha.getTime() <= ahora.getTime() - 6e4) return error(400, "Esa fecha ya ha pasado");
      let ant = tipo === "cita" && Number.isFinite(+c.antelacionMin) ? Math.max(0, Math.min(10080, Math.round(+c.antelacionMin))) : 0;
      if (fecha && ant > 0 && fecha.getTime() - ant * 6e4 <= ahora.getTime()) ant = 0;
      const base = { uid: u.id, tipo, titulo, lugar: String(c.lugar ?? "").trim().slice(0, 80), fechaHora: fecha, antelacionMin: ant, repeticion: REPS.includes(c.repeticion) ? c.repeticion : "ninguna", avisado: false, hecho: false, creadoEn: ahora, ...mensaje ? { mensaje } : {}, ...nota ? { nota } : {}, ...tipo === "tarea" ? { subtareas: [] } : {} };
      let ev = await deps.almacen.guardarEvento(base);
      ev = await programarEvento(deps.almacen, ev, u.zona, ahora);
      await deps.almacen.guardarEvento(ev);
      return ok({ evento: eventoJson(ev, u, ahora) });
    }
    case "/api/evento/accion": {
      const ev = await deps.almacen.getEvento(u.id, String(c.id ?? ""));
      if (!ev) return error(404, "Ese evento ya no existe");
      if (ev.tipo === "tarea" && ["subtarea_anadir", "subtarea_hecha", "subtarea_borrar"].includes(String(c.accion))) {
        const subs = [...ev.subtareas ?? []];
        if (c.accion === "subtarea_anadir") {
          const titulo = String(c.titulo ?? "").trim().slice(0, 120);
          if (!titulo) return error(400, "Escribe la subtarea");
          if (subs.length >= 50) return error(409, "Esta tarea ya tiene demasiadas subtareas");
          const subtarea = { id: crypto.randomUUID().replace(/-/g, "").slice(0, 12), titulo, hecho: false };
          subs.push(subtarea);
          const nuevo2 = { ...ev, subtareas: subs };
          await deps.almacen.guardarEvento(nuevo2);
          return ok({ subtarea, evento: eventoJson(nuevo2, u, ahora) });
        }
        const sid = String(c.subtareaId ?? "");
        const pos = subs.findIndex((x) => x.id === sid);
        if (pos < 0) return error(404, "Esa subtarea ya no existe");
        if (c.accion === "subtarea_hecha") subs[pos] = { ...subs[pos], hecho: !subs[pos].hecho };
        else subs.splice(pos, 1);
        const nuevo = { ...ev, subtareas: subs };
        await deps.almacen.guardarEvento(nuevo);
        return ok({ evento: eventoJson(nuevo, u, ahora) });
      }
      if (c.accion === "borrar") {
        await cancelarEvento(deps.almacen, u.id, ev.id);
        return ok();
      }
      if (c.accion === "hecho") {
        const nuevo = { ...ev, hecho: !ev.hecho };
        await deps.almacen.guardarEvento(nuevo);
        await programarEvento(deps.almacen, nuevo, u.zona, ahora);
        return ok({ evento: eventoJson(nuevo, u, ahora) });
      }
      return error(400, "Acci\xF3n desconocida");
    }
    case "/api/ciudad": {
      const lugares = await buscarLugares(deps.http, String(c.nombre ?? "").slice(0, 60)).catch(() => []);
      if (!c.elegir) return ok({ lugares: lugares.map((l2, i) => ({ i, etiqueta: l2.etiqueta })) });
      const l = lugares[Number(c.elegir.i)];
      if (!l) return error(404, "No encuentro ese lugar");
      u.ciudad = { nombre: l.nombre, provincia: l.provincia, lat: l.lat, lon: l.lon };
      u.zona = l.zona;
      await deps.almacen.guardarUsuario(u);
      await sincronizarSecciones(deps.almacen, u, ahora);
      return ok({ ciudad: l.nombre });
    }
    case "/api/ver": {
      if (c.guardado === true && c.ref !== "todo") {
        const g = await leerResumen(deps.almacen, u, String(c.ref ?? ""), ahora);
        if (g) return ok({ secciones: [{ ref: String(c.ref), html: g.html, botones: g.acciones ?? [], grupos: g.grupos, tiempo: g.tiempo, hora: horaLocal(g.hora, u.zona), guardado: true }] });
      }
      const conocidas = /* @__PURE__ */ new Set([...ORDEN_SECCIONES.map(String), ...u.temas.map((t) => `tema:${t.id}`)]);
      const refs = Array.isArray(c.refs) ? [...new Set(c.refs.map(String).filter((r) => conocidas.has(r)))].slice(0, 20) : c.ref === "todo" ? refsActivas(u) : [String(c.ref ?? "")];
      if (!refs.length) return error(409, "No tienes ninguna secci\xF3n activada");
      const hechas = await Promise.all(refs.map(async (ref) => {
        try {
          const cont = await contenidoDeSeccion(deps, u, ref);
          return { ref, html: cont.html, botones: cont.acciones ?? [], grupos: cont.grupos, tiempo: cont.tiempo, hora: horaLocal(ahora.toISOString(), u.zona) };
        } catch (e) {
          return { ref, error: String(e.message ?? e).slice(0, 100) };
        }
      }));
      return ok({ secciones: hechas });
    }
    case "/api/foto": {
      if (!u.ciudad) return ok({ foto: "" });
      return ok({ foto: await fotoCiudad(deps.http, deps.almacen, ahora, u.ciudad.nombre, u.ciudad.provincia) });
    }
    case "/api/push/clave":
      return ok({ clave: (await claveVapid(deps.almacen, ahora)).publica });
    case "/api/push/suscribir": {
      const sub = c.suscripcion;
      if (!suscripcionValida(sub)) return error(400, "La suscripci\xF3n no es v\xE1lida");
      const nombre = String(c.dispositivo ?? "Dispositivo").trim().slice(0, 40) || "Dispositivo";
      const resto = u.notificaciones.suscripciones.filter((x) => x.endpoint !== sub.endpoint);
      u.notificaciones.suscripciones = [...resto, { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, dispositivo: nombre, desde: ahora.toISOString() }].slice(-6);
      await deps.almacen.guardarUsuario(u);
      return ok();
    }
    case "/api/push/quitar": {
      u.notificaciones.suscripciones = u.notificaciones.suscripciones.filter((x) => x.endpoint.slice(-24) !== c.id && x.endpoint !== c.endpoint);
      await deps.almacen.guardarUsuario(u);
      return ok();
    }
    case "/api/push/probar": {
      if (!deps.push) return error(409, "Las notificaciones no est\xE1n disponibles");
      if (!u.notificaciones.suscripciones.length) return error(409, "Ning\xFAn dispositivo tiene las notificaciones activadas");
      let enviadas = 0;
      const vivas = [];
      for (const sub of u.notificaciones.suscripciones) {
        const r = await deps.push(sub, { sonido: u.notificaciones.sonido, modo: modoEfectivo(u, ahora), titulo: "\u{1F514} Notificaciones activadas", cuerpo: "As\xED te avisar\xE9 de tus res\xFAmenes y recordatorios.", url: "/app/", etiqueta: "prueba" });
        if (r === "ok") enviadas++;
        if (r !== "caducada") vivas.push(sub);
      }
      if (vivas.length !== u.notificaciones.suscripciones.length) {
        u.notificaciones.suscripciones = vivas;
        await deps.almacen.guardarUsuario(u);
      }
      return enviadas ? ok({ enviadas }) : error(502, "No he podido enviarla: vuelve a activar las notificaciones en ese dispositivo");
    }
    case "/api/notificaciones": {
      if (c.sonido !== void 0) {
        if (!["signature", "crystal", "pulse", "halo", "orbit", "velvet"].includes(c.sonido)) return error(400, "Sonido desconocido");
        u.notificaciones.sonido = c.sonido;
      }
      await deps.almacen.guardarUsuario(u);
      return ok({ sonido: u.notificaciones.sonido });
    }
    case "/api/avatar": {
      if (c.tipo === "emoji") {
        const a = avatarEmoji(c.emoji, c.color);
        if (!a) return error(400, "Ese avatar no existe");
        u.avatar = a;
      } else if (c.tipo === "foto") {
        if (!fotoValida(c.foto)) return error(400, "La foto no es v\xE1lida o pesa demasiado");
        await deps.almacen.cacheSet(claveFoto(u.id), c.foto, VIGENCIA_FOTO_MS, ahora);
        u.avatar = { tipo: "foto" };
      } else if (c.tipo === "ninguno") u.avatar = null;
      else return error(400, "Tipo de avatar desconocido");
      await deps.almacen.guardarUsuario(u);
      return ok();
    }
    case "/api/compra": {
      const l = u.compra;
      if (c.accion === "compartir") {
        if (!l.token) {
          l.token = tokenNuevo();
        }
        await deps.almacen.guardarUsuario(u);
        await deps.almacen.cacheSet(claveLista(l.token), u.id, VIGENCIA_LISTA_MS, ahora);
        return ok({ compra: l, enlace: enlaceLista(deps, l.token) });
      }
      if (c.accion === "descompartir") {
        l.token = null;
        await deps.almacen.guardarUsuario(u);
        return ok({ compra: l });
      }
      const fallo = editarCompra(l, c, ahora, true);
      if (fallo) return fallo;
      if (c.accion === "terminar") l.token = null;
      await deps.almacen.guardarUsuario(u);
      return ok({ compra: l, enlace: l.token ? enlaceLista(deps, l.token) : null });
    }
    case "/api/perfil": {
      if (typeof c.nombre === "string") u.nombre = c.nombre.trim().slice(0, 40);
      if (typeof c.nacimiento === "string" && c.nacimiento) {
        const n = parseNacimiento(c.nacimiento.split("-").reverse().join("/"), ahora);
        if (!n) return error(400, "La fecha de nacimiento no es v\xE1lida");
        u.nacimiento = n;
      }
      await deps.almacen.guardarUsuario(u);
      return ok();
    }
    case "/api/tema": {
      if (c.borrar) {
        u.temas = u.temas.filter((t) => t.id !== c.borrar);
        await deps.almacen.guardarUsuario(u);
        await programarSeccion(deps.almacen, u, `tema:${c.borrar}`, ahora);
        return ok();
      }
      const titulo = String(c.titulo ?? "").trim().slice(0, 60);
      if (!titulo) return error(400, "Escribe el tema");
      if (u.temas.length >= 15) return error(409, "Ya tienes muchos temas: elimina alguno");
      let id = slug(titulo), n = 2;
      while (u.temas.some((t) => t.id === id)) id = `${slug(titulo)}-${n++}`;
      const m = 8 * 60 + 30 + u.temas.length * 5;
      const tema = { id, titulo, emoji: "\u2B50", consulta: String(c.consulta ?? "").trim().slice(0, 120) || titulo, hora: `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, activa: true };
      u.temas.push(tema);
      await deps.almacen.guardarUsuario(u);
      await programarSeccion(deps.almacen, u, `tema:${id}`, ahora);
      return ok({ ref: `tema:${id}` });
    }
    default:
      return error(404, "No existe");
  }
}
__name(manejarApi, "manejarApi");

// src/firebaseAuth.ts
var CERTIFICADOS_FIREBASE = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
var decodificar3 = /* @__PURE__ */ __name((segmento) => {
  if (!/^[A-Za-z0-9_-]+$/.test(segmento)) throw new Error("Segmento JWT no v\xE1lido");
  const base64 = segmento.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}, "decodificar");
var leerJson = /* @__PURE__ */ __name((segmento) => JSON.parse(new TextDecoder().decode(decodificar3(segmento))), "leerJson");
function crearVerificadorFirebase(obtener = fetch, ahora = Date.now) {
  let cache = null;
  const cargarClaves = /* @__PURE__ */ __name(async (forzar = false) => {
    if (!forzar && cache && cache.caduca > ahora()) return cache.claves;
    const respuesta = await obtener(CERTIFICADOS_FIREBASE, { headers: { accept: "application/json" } });
    if (!respuesta.ok) throw new Error(`No se pudieron obtener las claves de Firebase (${respuesta.status})`);
    const cuerpo = await respuesta.json();
    if (!Array.isArray(cuerpo.keys)) throw new Error("La respuesta de claves de Firebase no es v\xE1lida");
    const claves = new Map(cuerpo.keys.filter((clave) => typeof clave.kid === "string").map((clave) => [clave.kid, clave]));
    if (claves.size === 0) throw new Error("Firebase no public\xF3 claves de firma");
    const maxAge = Number(/max-age=(\d+)/i.exec(respuesta.headers.get("cache-control") ?? "")?.[1] ?? 3600);
    cache = { claves, caduca: ahora() + Math.max(60, Math.min(maxAge, 86400)) * 1e3 };
    return claves;
  }, "cargarClaves");
  return async (token, proyecto) => {
    if (!proyecto || token.length > 16384) return null;
    const partes = token.split(".");
    if (partes.length !== 3 || partes.some((parte) => !parte)) return null;
    let cabecera2;
    let claims;
    let firma;
    try {
      cabecera2 = leerJson(partes[0]);
      claims = leerJson(partes[1]);
      firma = decodificar3(partes[2]);
    } catch {
      return null;
    }
    if (cabecera2.alg !== "RS256" || typeof cabecera2.kid !== "string") return null;
    const segundos = Math.floor(ahora() / 1e3);
    if (claims.aud !== proyecto || claims.iss !== `https://securetoken.google.com/${proyecto}` || typeof claims.sub !== "string" || claims.sub.length < 1 || claims.sub.length > 128 || typeof claims.exp !== "number" || claims.exp <= segundos || typeof claims.iat !== "number" || claims.iat > segundos + 60 || claims.exp <= claims.iat || typeof claims.auth_time !== "number" || claims.auth_time > segundos + 60) return null;
    let clave = (await cargarClaves()).get(cabecera2.kid);
    if (!clave) clave = (await cargarClaves(true)).get(cabecera2.kid);
    if (!clave || clave.kty !== "RSA" || clave.alg !== "RS256") return null;
    let valida = false;
    try {
      const publica = await crypto.subtle.importKey("jwk", clave, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
      valida = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publica, firma, new TextEncoder().encode(`${partes[0]}.${partes[1]}`));
    } catch {
      return null;
    }
    if (!valida) return null;
    return {
      uid: claims.sub,
      ...typeof claims.email === "string" ? { email: claims.email } : {},
      ...typeof claims.name === "string" ? { nombre: claims.name } : {}
    };
  };
}
__name(crearVerificadorFirebase, "crearVerificadorFirebase");
var verificarTokenFirebase = crearVerificadorFirebase();

// src/app.ts
var fabricaReal = /* @__PURE__ */ __name(() => {
  const http = new HttpFetch();
  return { http, restantes: /* @__PURE__ */ __name(() => http.restantes, "restantes") };
}, "fabricaReal");
var ZONA = "Europe/Madrid";
var CRON_HOROSCOPO = "*/10 4-10 * * *";
var MAX_PROGRAMACIONES = 20;
var SIMULTANEAS = 5;
var horoscopoCfg = /* @__PURE__ */ __name((env) => ({ baseUrl: env.HOROSCOPO_BASE_URL ?? "https://horoscopefree.fly.dev", idioma: env.HOROSCOPO_IDIOMA ?? "es", directo: true }), "horoscopoCfg");
function dependencias(env, s, urlBase) {
  const almacen = new AlmacenD1(env.DB);
  return {
    almacen,
    http: s.http,
    ahora: /* @__PURE__ */ __name(() => /* @__PURE__ */ new Date(), "ahora"),
    horoscopoCfg: horoscopoCfg(env),
    podcastFeed: env.PODCAST_FEED ?? FEED_PODCAST,
    urlBase,
    push: crearEmisorPush(almacen, () => /* @__PURE__ */ new Date(), async (url, cabeceras, cuerpo) => (await fetch(url, { method: "POST", headers: cabeceras, body: cuerpo })).status, (m) => console.warn(m))
  };
}
__name(dependencias, "dependencias");
async function enParalelo(tareas, n) {
  const res = new Array(tareas.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, tareas.length) }, async () => {
    while (i < tareas.length) {
      const k = i++;
      res[k] = await tareas[k]();
    }
  }));
  return res;
}
__name(enParalelo, "enParalelo");
async function manejarTick(env, ahora = () => /* @__PURE__ */ new Date(), fabrica = fabricaReal) {
  const s = fabrica();
  const dep = { ...dependencias(env, s), ahora, log: /* @__PURE__ */ __name((m) => console.warn(m), "log") };
  const instante = ahora();
  const vencidas = await dep.almacen.programacionesVencidas(instante, MAX_PROGRAMACIONES);
  let total = { enviados: 0, omitidos: 0, fallidos: 0 };
  const tareas = vencidas.map((p) => () => procesarProgramacion({ ...dep, ahora: /* @__PURE__ */ __name(() => instante, "ahora") }, p));
  const resultados = await enParalelo(tareas, SIMULTANEAS);
  for (const r of resultados) total = sumar(total, r);
  const t = ahora();
  if (t.getUTCHours() === 3 && t.getUTCMinutes() === 0) await dep.almacen.limpiarCache(t);
  if (total.enviados || total.fallidos) console.info("tick", total);
  return total;
}
__name(manejarTick, "manejarTick");
async function manejarHoroscopo(env, ahora = /* @__PURE__ */ new Date()) {
  const http = new HttpFetch();
  const almacen = new AlmacenD1(env.DB);
  const r = await actualizarTodos({
    http,
    config: horoscopoCfg(env),
    zona: ZONA,
    ahora,
    guardar: /* @__PURE__ */ __name((id, doc) => almacen.guardarHoroscopo(id, doc), "guardar"),
    fechaGuardada: /* @__PURE__ */ __name(async (id) => (await almacen.getHoroscopo(id))?.fecha, "fechaGuardada"),
    log: /* @__PURE__ */ __name((m) => console.info(m), "log"),
    intentos: 2,
    esperaMs: 500,
    maxPedidos: 4
  });
  if (r.actualizados.length || r.fallidos.length) console.info("hor\xF3scopo", r);
  return r;
}
__name(manejarHoroscopo, "manejarHoroscopo");
async function manejarApiWeb(req, env, url, fabrica, verificarFirebase) {
  const json = /* @__PURE__ */ __name((status, body) => Response.json(body, { status, headers: { "cache-control": "no-store" } }), "json");
  if (req.method !== "POST") return json(405, { error: "m\xE9todo no permitido" });
  const authorization = req.headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(.+)$/i.exec(authorization);
  const projectId = env.FIREBASE_WEB_CONFIG?.projectId;
  if (!bearer || !projectId) return json(401, { error: "Inicia sesi\xF3n en Nexora para continuar." });
  let identidad;
  try {
    identidad = await verificarFirebase(bearer[1], projectId);
  } catch (error2) {
    console.error(`Firebase token verification unavailable: ${error2.message}`);
    return json(503, { error: "No se pudo validar la sesi\xF3n. Int\xE9ntalo de nuevo." });
  }
  if (!identidad) return json(401, { error: "La sesi\xF3n no es v\xE1lida. Inicia sesi\xF3n de nuevo." });
  const deps = dependencias(env, fabrica(), url.origin);
  let usuario = await deps.almacen.getUsuario(identidad.uid);
  if (!usuario) {
    const nombre = identidad.nombre?.trim() || identidad.email?.split("@")[0] || "Usuario";
    usuario = usuarioNuevo(identidad.uid, nombre, /* @__PURE__ */ new Date());
    await deps.almacen.guardarUsuario(usuario);
  }
  try {
    const respuesta = await manejarApi(deps, usuario, url.pathname, await req.json().catch(() => ({})) ?? {});
    return json(respuesta.estado, respuesta.cuerpo);
  } catch (error2) {
    console.error(`api ${url.pathname}: ${error2.message}`);
    return json(500, { error: "Algo ha fallado. Int\xE9ntalo de nuevo." });
  }
}
__name(manejarApiWeb, "manejarApiWeb");
async function manejarFetch(req, env, _ctx, fabrica = fabricaReal, verificarFirebase = verificarTokenFirebase) {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin") ?? "";
    const permitido = origin && (env.APP_ORIGINS ?? "").split(",").map((x) => x.trim()).includes(origin);
    if (req.method === "OPTIONS") {
      if (!permitido) return new Response(null, { status: 403 });
      const methods = url.pathname === "/api/config" ? "GET, OPTIONS" : "POST, OPTIONS";
      return new Response(null, { status: 204, headers: {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": methods,
        "access-control-allow-headers": "Authorization, Content-Type",
        "access-control-max-age": "600",
        "vary": "Origin"
      } });
    }
    let response;
    if (url.pathname === "/api/config") {
      response = req.method === "GET" ? Response.json({ firebase: env.FIREBASE_WEB_CONFIG ?? null }, { headers: { "cache-control": "no-store" } }) : Response.json({ error: "m\xE9todo no permitido" }, { status: 405, headers: { allow: "GET, OPTIONS" } });
    } else if (url.pathname === "/api/lista") {
      if (req.method !== "POST") response = Response.json({ error: "m\xE9todo no permitido" }, { status: 405, headers: { "cache-control": "no-store" } });
      else {
        const body = await req.json().catch(() => ({})) ?? {};
        const result = await manejarListaPublica(dependencias(env, fabrica()), body);
        response = Response.json(result.cuerpo, { status: result.estado, headers: { "cache-control": "no-store" } });
      }
    } else {
      response = await manejarApiWeb(req, env, url, fabrica, verificarFirebase);
    }
    if (!permitido) return response;
    const headers = new Headers(response.headers);
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", url.pathname === "/api/config" ? "GET, OPTIONS" : "POST, OPTIONS");
    headers.set("access-control-allow-headers", "Authorization, Content-Type");
    headers.set("vary", "Origin");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  if (url.pathname === "/" || url.pathname === "/agenda" || url.pathname === "/agenda/") return Response.redirect(new URL("/app/" + url.search + url.hash, url), 302);
  return new Response("not found", { status: 404 });
}
__name(manejarFetch, "manejarFetch");

// src/worker.ts
var worker_default = {
  fetch: /* @__PURE__ */ __name((req, env, ctx) => manejarFetch(req, env, ctx), "fetch"),
  async scheduled(evento, env) {
    if (evento.cron === CRON_HOROSCOPO) await manejarHoroscopo(env);
    else await manejarTick(env);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
