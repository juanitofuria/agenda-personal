import { Avatar } from "./modelo";

/** Avatares a elegir (la mini app y el asistente del bot usan esta misma lista). Cada uno va sobre un fondo de color. */
export const AVATARES = [
  "🦊", "🐼", "🐨", "🦁", "🐯", "🐸", "🐵", "🐧", "🦉", "🦄", "🐙", "🦋", "🐢", "🐬", "🦈", "🐳", "🦖", "🐝", "🐞", "🦔",
  "🐰", "🐻", "🐶", "🐱", "🐹", "🦒", "🦓", "🦘", "🦜", "🦩", "🐺", "🦝", "🐮", "🐷", "🐴", "🦌", "🦦", "🦥", "🐊", "🦅",
  "🌵", "🌻", "🌸", "🍀", "🍄", "🌈", "⭐", "🌙", "☀️", "🔥", "⚡", "❄️", "🌊", "🍎", "🍓", "🍋", "🥑", "🍕", "🍩", "☕",
  "🎸", "🎧", "🎮", "🎨", "📚", "🚀", "⚽", "🏀", "🚲", "⛵", "🏔️", "🎯", "🧩", "🪁", "🎭", "🤖", "👽", "👻", "🧙", "🦸",
] as const;

/** Fondos disponibles (la mini app los pinta; aquí solo se valida el número). */
export const NUM_COLORES = 8;

/** Avatar de emoji válido (o null si el emoji no está en la lista). */
export function avatarEmoji(emoji: unknown, color: unknown): Avatar | null {
  const e = (AVATARES as readonly string[]).find((x) => x === emoji);
  const c = Number(color);
  return e && Number.isInteger(c) && c >= 0 && c < NUM_COLORES ? { tipo: "emoji", emoji: e, color: c } : null;
}

/** Foto enviada por la mini app: una imagen pequeña en base64. */
export const fotoValida = (v: unknown): v is string => typeof v === "string" && v.length <= 70_000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v);

export const claveFoto = (uid: string) => `avatar:${uid}`;
export const VIGENCIA_FOTO_MS = 3650 * 24 * 3600_000;
