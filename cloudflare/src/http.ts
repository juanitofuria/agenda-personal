import { HttpGet } from "../../firebase/functions/src/util";
import { HttpPost } from "../../firebase/functions/src/telegram";

/**
 * Cliente HTTP sobre `fetch` con la forma de axios que espera el resto del código ({ data } y errores con `response`).
 * Cloudflare (plan gratuito) permite 50 peticiones salientes por ejecución y 6 conexiones a la vez:
 * se cuenta el presupuesto y se limita la concurrencia.
 */
export class ErrorHttp extends Error {
  constructor(mensaje: string, readonly response?: { status: number; data: unknown }) { super(mensaje); }
}

export class HttpFetch implements HttpGet, HttpPost {
  private usadas = 0;
  private activas = 0;
  private cola: Array<() => void> = [];
  constructor(private maxPeticiones = 45, private maxConcurrentes = 5, private fetcher: typeof fetch = (...a) => fetch(...a)) {}

  get restantes() { return this.maxPeticiones - this.usadas; }

  private async turno(): Promise<void> {
    if (this.activas >= this.maxConcurrentes) await new Promise<void>((r) => this.cola.push(r));
    this.activas++;
  }
  private liberar() { this.activas--; this.cola.shift()?.(); }

  private async pedir(url: string, init: RequestInit, timeout = 20000, maxBytes?: number): Promise<{ data: unknown }> {
    if (this.usadas >= this.maxPeticiones) throw new ErrorHttp("presupuesto de peticiones salientes agotado en esta ejecución");
    this.usadas++;
    await this.turno();
    try {
      let r: Response;
      try {
        r = await this.fetcher(url, { ...init, signal: AbortSignal.timeout(timeout) });
      } catch (e) {
        throw new ErrorHttp((e as Error).message || "error de red");
      }
      const texto = maxBytes ? await leerInicio(r, maxBytes) : await r.text();
      let data: unknown = texto;
      if ((r.headers.get("content-type") ?? "").includes("json") || /^\s*[[{]/.test(texto)) { try { data = JSON.parse(texto); } catch { /* se queda como texto */ } }
      if (!r.ok) throw new ErrorHttp(`HTTP ${r.status}`, { status: r.status, data });
      return { data };
    } finally {
      this.liberar();
    }
  }

  get(url: string, opciones?: { timeout?: number; headers?: Record<string, string>; maxBytes?: number }) {
    return this.pedir(url, { method: "GET", headers: opciones?.headers }, opciones?.timeout, opciones?.maxBytes);
  }
  post(url: string, cuerpo?: unknown, opciones?: { timeout?: number }) {
    return this.pedir(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo ?? {}) }, opciones?.timeout);
  }
}

/** Lee solo el principio de la respuesta (y cancela el resto): un feed de podcast puede pesar megas y solo hacen falta los primeros episodios. */
async function leerInicio(r: Response, maxBytes: number): Promise<string> {
  if (!r.body) return (await r.text()).slice(0, maxBytes);
  const lector = r.body.getReader();
  const trozos: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await lector.read();
    if (done || !value) break;
    trozos.push(value); total += value.byteLength;
  }
  await lector.cancel().catch(() => undefined);
  const todo = new Uint8Array(total);
  let pos = 0;
  for (const t of trozos) { todo.set(t, pos); pos += t.byteLength; }
  return new TextDecoder().decode(todo);
}
