import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fechaIso, formatearFechaHora, localAUtc, parseFechaHora, parseHoraHHMM, parseNacimiento, partesEnZona,
  proximaOcurrencia, siguienteRepeticion,
} from "./fechas";

const MAD = "Europe/Madrid";
// Domingo 4 de octubre de 2026, 10:00 en Madrid (UTC+2, horario de verano).
const AHORA = new Date("2026-10-04T08:00:00Z");

const local = (d: Date, z = MAD) => { const p = partesEnZona(d, z); return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")} ${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`; };

test("localAUtc respeta el horario de verano e invierno", () => {
  assert.equal(localAUtc(2026, 7, 1, 9, 0, MAD).toISOString(), "2026-07-01T07:00:00.000Z"); // UTC+2
  assert.equal(localAUtc(2026, 12, 1, 9, 0, MAD).toISOString(), "2026-12-01T08:00:00.000Z"); // UTC+1
  assert.equal(localAUtc(2026, 10, 25, 9, 0, MAD).toISOString(), "2026-10-25T08:00:00.000Z"); // día del cambio, ya UTC+1
  assert.equal(localAUtc(2026, 3, 29, 9, 0, MAD).toISOString(), "2026-03-29T07:00:00.000Z"); // día del cambio, ya UTC+2
  assert.equal(localAUtc(2026, 7, 1, 9, 0, "America/New_York").toISOString(), "2026-07-01T13:00:00.000Z");
});

test("partesEnZona y fechaIso usan la zona pedida", () => {
  const i = new Date("2026-10-03T22:30:00Z");
  assert.equal(fechaIso(i, MAD), "2026-10-04"); assert.equal(fechaIso(i, "UTC"), "2026-10-03");
  assert.equal(partesEnZona(AHORA, MAD).dow, 0); // domingo
});

test("parseHoraHHMM", () => {
  assert.deepEqual(parseHoraHHMM("07:30"), [7, 30]); assert.deepEqual(parseHoraHHMM("7.05"), [7, 5]);
  assert.deepEqual(parseHoraHHMM("18h"), [18, 0]); assert.deepEqual(parseHoraHHMM("9"), [9, 0]);
  assert.equal(parseHoraHHMM("25:00"), null); assert.equal(parseHoraHHMM("10:75"), null); assert.equal(parseHoraHHMM("hola"), null);
});

test("proximaOcurrencia: hoy si no ha pasado, si no mañana (en la zona del usuario)", () => {
  assert.equal(local(proximaOcurrencia("14:00", MAD, AHORA)), "2026-10-04 14:00");
  assert.equal(local(proximaOcurrencia("07:00", MAD, AHORA)), "2026-10-05 07:00");
  assert.equal(local(proximaOcurrencia("10:00", MAD, AHORA)), "2026-10-05 10:00"); // justo ahora ya cuenta como pasado
  // el mismo instante, en Nueva York, aún es madrugada
  assert.equal(local(proximaOcurrencia("07:00", "America/New_York", AHORA), "America/New_York"), "2026-10-04 07:00");
});

test("siguienteRepeticion conserva la hora local aunque cambie el horario", () => {
  const sab = localAUtc(2026, 10, 24, 9, 0, MAD); // sábado, antes del cambio de hora del 25-oct
  assert.equal(local(siguienteRepeticion(sab, "diaria", MAD)!), "2026-10-25 09:00");
  assert.equal(siguienteRepeticion(sab, "diaria", MAD)!.toISOString(), "2026-10-25T08:00:00.000Z"); // ahora UTC+1
  assert.equal(local(siguienteRepeticion(sab, "semanal", MAD)!), "2026-10-31 09:00");
  assert.equal(local(siguienteRepeticion(localAUtc(2026, 10, 2, 9, 0, MAD), "laborables", MAD)!), "2026-10-05 09:00"); // viernes -> lunes
  assert.equal(local(siguienteRepeticion(localAUtc(2026, 10, 5, 9, 0, MAD), "laborables", MAD)!), "2026-10-06 09:00");
  assert.equal(siguienteRepeticion(sab, "ninguna", MAD), null);
});

test("parseFechaHora: relativas", () => {
  assert.equal(parseFechaHora("en 30 min", AHORA, MAD)!.utc.toISOString(), "2026-10-04T08:30:00.000Z");
  assert.equal(parseFechaHora("en 2 horas", AHORA, MAD)!.utc.toISOString(), "2026-10-04T10:00:00.000Z");
  assert.equal(local(parseFechaHora("en 3 dias", AHORA, MAD)!.utc), "2026-10-07 10:00");
});

test("parseFechaHora: hoy, mañana y pasado mañana con hora", () => {
  assert.equal(local(parseFechaHora("hoy 18:30", AHORA, MAD)!.utc), "2026-10-04 18:30");
  assert.equal(local(parseFechaHora("mañana 9:15", AHORA, MAD)!.utc), "2026-10-05 09:15");
  assert.equal(local(parseFechaHora("Mañana a las 10", AHORA, MAD)!.utc), "2026-10-05 10:00");
  assert.equal(local(parseFechaHora("pasado mañana 8h", AHORA, MAD)!.utc), "2026-10-06 08:00");
  assert.equal(local(parseFechaHora("mañana 6 de la tarde", AHORA, MAD)!.utc), "2026-10-05 18:00");
  assert.equal(local(parseFechaHora("mañana 9 pm", AHORA, MAD)!.utc), "2026-10-05 21:00");
  assert.equal(local(parseFechaHora("mañana 12 am", AHORA, MAD)!.utc), "2026-10-05 00:00");
});

test("parseFechaHora: solo hora (hoy si falta, si no mañana)", () => {
  assert.equal(local(parseFechaHora("18:30", AHORA, MAD)!.utc), "2026-10-04 18:30");
  assert.equal(local(parseFechaHora("a las 8", AHORA, MAD)!.utc), "2026-10-05 08:00"); // ya pasó hoy
});

test("parseFechaHora: fechas con día y mes", () => {
  assert.equal(local(parseFechaHora("15/10 18:00", AHORA, MAD)!.utc), "2026-10-15 18:00");
  assert.equal(local(parseFechaHora("15-10-2027 7:00", AHORA, MAD)!.utc), "2027-10-15 07:00");
  assert.equal(local(parseFechaHora("15 de octubre a las 11", AHORA, MAD)!.utc), "2026-10-15 11:00");
  assert.equal(local(parseFechaHora("3/1 10:00", AHORA, MAD)!.utc), "2027-01-03 10:00"); // sin año y ya pasó: el siguiente
  assert.equal(parseFechaHora("32/10", AHORA, MAD), null);
  assert.equal(parseFechaHora("15/13", AHORA, MAD), null);
});

test("parseFechaHora: días de la semana", () => {
  assert.equal(local(parseFechaHora("lunes 10:00", AHORA, MAD)!.utc), "2026-10-05 10:00");
  assert.equal(local(parseFechaHora("el viernes a las 20:30", AHORA, MAD)!.utc), "2026-10-09 20:30");
  assert.equal(local(parseFechaHora("domingo 18:00", AHORA, MAD)!.utc), "2026-10-04 18:00"); // hoy es domingo y aún es pronto
  assert.equal(local(parseFechaHora("domingo 9:00", AHORA, MAD)!.utc), "2026-10-11 09:00"); // hoy ya pasó
  assert.equal(local(parseFechaHora("miércoles", AHORA, MAD)!.utc), "2026-10-07 09:00");
});

test("parseFechaHora: sin hora usa las 09:00 y lo indica; marca las fechas pasadas", () => {
  const r = parseFechaHora("mañana", AHORA, MAD)!;
  assert.equal(local(r.utc), "2026-10-05 09:00"); assert.equal(r.horaPorDefecto, true);
  assert.equal(parseFechaHora("mañana 9:00", AHORA, MAD)!.horaPorDefecto, false);
  assert.equal(parseFechaHora("hoy 8:00", AHORA, MAD)!.pasada, true);
  assert.equal(parseFechaHora("hoy 23:00", AHORA, MAD)!.pasada, false);
  assert.equal(parseFechaHora("15/10/2020 10:00", AHORA, MAD)!.pasada, true);
});

test("parseFechaHora: cambio de hora y otras zonas", () => {
  assert.equal(parseFechaHora("25/10 9:00", AHORA, MAD)!.utc.toISOString(), "2026-10-25T08:00:00.000Z");
  // En Ciudad de México (UTC-6) son las 02:00 del día 4: "hoy 9:00" es ese mismo día.
  assert.equal(parseFechaHora("hoy 9:00", AHORA, "America/Mexico_City")!.utc.toISOString(), "2026-10-04T15:00:00.000Z");
});

test("parseFechaHora: ayer es una fecha pasada", () => {
  const r = parseFechaHora("ayer 10:00", AHORA, MAD)!;
  assert.equal(local(r.utc), "2026-10-03 10:00"); assert.equal(r.pasada, true);
});

test("parseFechaHora: texto que no se entiende", () => {
  assert.equal(parseFechaHora("", AHORA, MAD), null);
  assert.equal(parseFechaHora("cuando pueda", AHORA, MAD), null);
  assert.equal(parseFechaHora("25:00", AHORA, MAD), null);
  assert.equal(parseFechaHora("mañana 25:00", AHORA, MAD), null);
});

test("formatearFechaHora", () => {
  assert.equal(formatearFechaHora(localAUtc(2026, 10, 6, 18, 30, MAD), MAD), "mar 6 oct · 18:30");
  assert.equal(formatearFechaHora(localAUtc(2026, 10, 6, 18, 30, MAD), MAD, AHORA), "mar 6 oct · 18:30");
  assert.equal(formatearFechaHora(localAUtc(2026, 10, 5, 9, 0, MAD), MAD, AHORA), "mañana · 09:00");
  assert.equal(formatearFechaHora(localAUtc(2026, 10, 4, 21, 0, MAD), MAD, AHORA), "hoy · 21:00");
});

test("parseNacimiento", () => {
  const hoy = new Date("2026-10-04T08:00:00Z");
  assert.equal(parseNacimiento("05/04/1984", hoy), "1984-04-05");
  assert.equal(parseNacimiento("5-4-1984", hoy), "1984-04-05");
  assert.equal(parseNacimiento("5.4.1984", hoy), "1984-04-05");
  assert.equal(parseNacimiento("31/02/1990", hoy), null);
  assert.equal(parseNacimiento("05/04/2030", hoy), null);
  assert.equal(parseNacimiento("05/04/1800", hoy), null);
  assert.equal(parseNacimiento("abril 1984", hoy), null);
});
