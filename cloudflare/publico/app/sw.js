/* Service worker de la app instalada: abre rápido, avisa si no hay conexión y recibe las notificaciones push. */
const CACHE = "agenda-v3";
const SONIDOS = ["signature", "crystal", "pulse", "halo", "orbit", "velvet"];
const BASICOS = ["/app/", "/app/frases.js", "/app/manifest.webmanifest", "/app/icon-claro.webp", "/app/icon-oscuro.webp", ...SONIDOS.map((s) => "/app/sonidos/agenda_" + s + ".wav")];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASICOS)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Páginas y recursos de la app: primero la red (siempre lo último) y, si no hay conexión, lo guardado. Los datos (/api/) nunca se guardan.
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || !u.pathname.startsWith("/app/")) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); }
    return r;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match("/app/"))));
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.tipo === "probar-sonido") self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => cs.forEach((c) => c.postMessage({ tipo: "probar-sonido", sonido: e.data.sonido })));
});

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { titulo: "Mi Agenda", cuerpo: e.data ? e.data.text() : "" }; }
  e.waitUntil((async () => { const cs = await self.clients.matchAll({ type: "window", includeUncontrolled: true }); cs.forEach((c) => c.postMessage({ tipo: "push-sonido", sonido: d.sonido || "signature" })); await self.registration.showNotification(d.titulo || "Mi Agenda Personal", {
    body: d.cuerpo || "", icon: d.modo === "oscuro" ? "/app/icon-oscuro.webp" : "/app/icon-claro.webp", badge: "/app/icon-claro.webp", tag: d.etiqueta || undefined, renotify: !!d.etiqueta,
    actions: d.enlace ? [{ action: "enlace", title: d.enlace.texto }] : [],
    data: { url: d.url || "/app/", enlace: d.enlace ? d.enlace.url : "", sonido: d.sonido || "signature" },
  })); })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const datos = e.notification.data || {};
  if (e.action === "enlace" && datos.enlace) { e.waitUntil(self.clients.openWindow(datos.enlace)); return; } // botón de la notificación: un toque (p. ej. WhatsApp con el mensaje escrito)
  const destino = new URL((e.notification.data && e.notification.data.url) || "/app/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
    for (const v of ventanas) { if (v.url.startsWith(self.location.origin + "/app/") && "focus" in v) { v.focus(); return v.navigate(destino); } }
    return self.clients.openWindow(destino);
  }));
});
