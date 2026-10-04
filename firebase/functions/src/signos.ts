import { SIGNOS, Signo } from "./horoscopo";

export interface SignoZodiaco extends Signo { simbolo: string; elemento: string }

const EXTRA: Record<string, [string, string]> = {
  aries: ["♈", "fuego"], tauro: ["♉", "tierra"], geminis: ["♊", "aire"], cancer: ["♋", "agua"], leo: ["♌", "fuego"], virgo: ["♍", "tierra"],
  libra: ["♎", "aire"], escorpio: ["♏", "agua"], sagitario: ["♐", "fuego"], capricornio: ["♑", "tierra"], acuario: ["♒", "aire"], piscis: ["♓", "agua"],
};

/** Signo zodiacal (tropical) de una fecha yyyy-MM-dd. */
export function signoDe(iso: string): SignoZodiaco {
  const m = +iso.slice(5, 7), d = +iso.slice(8, 10);
  const id =
    (m === 3 && d >= 21) || (m === 4 && d <= 19) ? "aries" : m === 4 || (m === 5 && d <= 20) ? "tauro" : m === 5 || (m === 6 && d <= 20) ? "geminis"
      : m === 6 || (m === 7 && d <= 22) ? "cancer" : m === 7 || (m === 8 && d <= 22) ? "leo" : m === 8 || (m === 9 && d <= 22) ? "virgo"
        : m === 9 || (m === 10 && d <= 22) ? "libra" : m === 10 || (m === 11 && d <= 21) ? "escorpio" : m === 11 || (m === 12 && d <= 21) ? "sagitario"
          : m === 12 || (m === 1 && d <= 19) ? "capricornio" : m === 1 || (m === 2 && d <= 18) ? "acuario" : "piscis";
  const s = SIGNOS.find((x) => x.id === id)!;
  return { ...s, simbolo: EXTRA[id][0], elemento: EXTRA[id][1] };
}
