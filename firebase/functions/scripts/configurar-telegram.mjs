#!/usr/bin/env node
/**
 * Registra el webhook del bot y su menú de comandos en Telegram.
 *
 *   TELEGRAM_BOT_TOKEN=123:ABC TELEGRAM_WEBHOOK_SECRET=una-cadena-larga \
 *     node scripts/configurar-telegram.mjs https://europe-west1-TU-PROYECTO.cloudfunctions.net/telegramWebhook
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const secreto = process.env.TELEGRAM_WEBHOOK_SECRET;
const url = process.argv[2];
if (!token || !secreto || !url) {
  console.error("Uso: TELEGRAM_BOT_TOKEN=… TELEGRAM_WEBHOOK_SECRET=… node scripts/configurar-telegram.mjs <URL de telegramWebhook>");
  process.exit(1);
}
if (!/^[A-Za-z0-9_-]{16,256}$/.test(secreto)) {
  console.error("El secreto debe tener entre 16 y 256 caracteres y solo letras, números, guion y guion bajo.");
  process.exit(1);
}

async function llamar(metodo, cuerpo) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo ?? {}) });
  const j = await r.json();
  if (!j.ok) throw new Error(`${metodo}: ${j.description}`);
  return j.result;
}

await llamar("setWebhook", { url, secret_token: secreto, allowed_updates: ["message", "callback_query", "my_chat_member"], max_connections: 20 });
await llamar("setMyCommands", {
  commands: [
    { command: "menu", description: "Menú principal" },
    { command: "hoy", description: "Resumen de hoy" },
    { command: "nueva", description: "Nueva alarma, cita o tarea" },
    { command: "eventos", description: "Mis alarmas, citas y tareas" },
    { command: "secciones", description: "Activar, desactivar y cambiar horas" },
    { command: "perfil", description: "Mis datos" },
    { command: "ayuda", description: "Ayuda" },
    { command: "cancelar", description: "Cancelar lo que estoy haciendo" },
    { command: "borrar", description: "Borrar todos mis datos" },
  ],
});
const info = await llamar("getWebhookInfo");
console.log("Webhook registrado:", { url: info.url, pendientes: info.pending_update_count, ultimoError: info.last_error_message ?? null });
