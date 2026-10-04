package com.agendapersonal.sections

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.sin

/**
 * Fases de la Luna calculadas en el propio móvil (sin red) con el algoritmo de Jean Meeus ("Astronomical Algorithms", cap. 49):
 * instante de cada luna nueva y llena con error de pocos minutos. La fase de un día se obtiene de su posición
 * entre dos lunas nuevas reales.
 */
object MoonPhase {
    private const val SYNODIC = 29.530588861
    private const val EPOCH_JD = 2451550.09766   // luna nueva de enero de 2000
    private const val DELTA_T_DAYS = 69.0 / 86400 // TT − UT aproximado

    private fun rad(d: Double) = Math.toRadians(d)

    /** Instante (día juliano, UT) de la luna nueva o llena número [n]. */
    private fun eventJd(n: Int, full: Boolean): Double {
        val k = n + if (full) 0.5 else 0.0
        val t = k / 1236.85
        val t2 = t * t; val t3 = t2 * t; val t4 = t3 * t
        var jde = EPOCH_JD + SYNODIC * k + 0.00015437 * t2 - 0.000000150 * t3 + 0.00000000073 * t4
        val e = 1 - 0.002516 * t - 0.0000074 * t2
        val m = rad(2.5534 + 29.10535670 * k - 0.0000014 * t2 - 0.00000011 * t3)
        val mp = rad(201.5643 + 385.81693528 * k + 0.0107582 * t2 + 0.00001238 * t3 - 0.000000058 * t4)
        val f = rad(160.7108 + 390.67050284 * k - 0.0016118 * t2 - 0.00000227 * t3 + 0.000000011 * t4)
        val om = rad(124.7746 - 1.56375588 * k + 0.0020672 * t2 + 0.00000215 * t3)
        val common = -0.00111 * sin(mp - 2 * f) - 0.00057 * sin(mp + 2 * f) + 0.00056 * e * sin(2 * mp + m) -
            0.00042 * sin(3 * mp) + 0.00042 * e * sin(m + 2 * f) + 0.00038 * e * sin(m - 2 * f) -
            0.00024 * e * sin(2 * mp - m) - 0.00017 * sin(om) - 0.00007 * sin(mp + 2 * m)
        jde += if (!full) {
            -0.40720 * sin(mp) + 0.17241 * e * sin(m) + 0.01608 * sin(2 * mp) + 0.01039 * sin(2 * f) +
                0.00739 * e * sin(mp - m) - 0.00514 * e * sin(mp + m) + 0.00208 * e * e * sin(2 * m) + common
        } else {
            -0.40614 * sin(mp) + 0.17302 * e * sin(m) + 0.01614 * sin(2 * mp) + 0.01043 * sin(2 * f) +
                0.00734 * e * sin(mp - m) - 0.00515 * e * sin(mp + m) + 0.00209 * e * e * sin(2 * m) + common
        }
        return jde - DELTA_T_DAYS
    }

    private fun toJd(i: Instant) = i.epochSecond / 86400.0 + i.nano / 86400e9 + 2440587.5
    private fun toInstant(jd: Double): Instant = Instant.ofEpochMilli(Math.round((jd - 2440587.5) * 86400_000))

    private fun noon(date: LocalDate, zone: ZoneId) = toJd(date.atTime(12, 0).atZone(zone).toInstant())

    /** Ciclo real que contiene al instante: (luna nueva anterior, luna llena intermedia, luna nueva siguiente). */
    private fun cycleAround(jd: Double): Triple<Double, Double, Double> {
        val n0 = floor((jd - EPOCH_JD) / SYNODIC).toInt()
        for (n in n0 - 1..n0 + 2) {
            val last = eventJd(n, full = false)
            val next = eventJd(n + 1, full = false)
            if (last <= jd && jd < next) return Triple(last, eventJd(n, full = true), next)
        }
        error("sin ciclo lunar para $jd")
    }

    /** Posición en el ciclo: 0 = nueva, 0,5 = llena (exacta), →1 = nueva siguiente. */
    private fun fraction(date: LocalDate, zone: ZoneId): Double {
        val jd = noon(date, zone)
        val (last, full, next) = cycleAround(jd)
        return if (jd < full) 0.5 * (jd - last) / (full - last) else 0.5 + 0.5 * (jd - full) / (next - full)
    }

    /** Edad de la luna en días desde la última luna nueva. */
    fun age(date: LocalDate, zone: ZoneId = ZoneId.systemDefault()): Double {
        val jd = noon(date, zone)
        return jd - cycleAround(jd).first
    }

    /** Fracción iluminada, de 0 a 1. */
    fun illumination(date: LocalDate, zone: ZoneId = ZoneId.systemDefault()): Double =
        (1 - cos(2 * Math.PI * fraction(date, zone))) / 2

    data class Phase(val emoji: String, val name: String)

    private val phases = listOf(
        Phase("🌑", "Luna nueva"), Phase("🌒", "Luna creciente"), Phase("🌓", "Cuarto creciente"), Phase("🌔", "Gibosa creciente"),
        Phase("🌕", "Luna llena"), Phase("🌖", "Gibosa menguante"), Phase("🌗", "Cuarto menguante"), Phase("🌘", "Luna menguante"),
    )

    /**
     * Fase del día. Nueva, cuartos y llena solo se asignan al día en que ocurren (el que tiene su mediodía a menos de medio día);
     * los días vecinos muestran la fase intermedia, así el calendario no repite 🌕 durante varios días.
     */
    fun phase(date: LocalDate, zone: ZoneId = ZoneId.systemDefault()): Phase {
        val f = fraction(date, zone)
        val halfDay = 0.5 / SYNODIC
        var idx = floor(f * 8 + 0.5).toInt() % 8
        if (idx % 2 == 0) { // nueva, cuarto creciente, llena, cuarto menguante
            val center = idx / 8.0
            val d = abs(f - center).let { if (idx == 0) minOf(it, abs(f - 1.0)) else it }
            if (d > halfDay) {
                val before = if (idx == 0) f > 0.5 else f < center
                idx = (if (before) idx - 1 + 8 else idx + 1) % 8
            }
        }
        return phases[idx]
    }

    /** Instante de la próxima luna nueva ([full] = false) o llena a partir de [from]. */
    fun nextEvent(from: Instant, full: Boolean): Instant {
        val jd = toJd(from)
        val n0 = floor((jd - EPOCH_JD) / SYNODIC).toInt()
        return toInstant((n0 - 1..n0 + 3).map { eventJd(it, full) }.first { it >= jd })
    }

    /** Día (en [zone]) de la próxima luna nueva o llena a partir de [from]. */
    fun next(from: LocalDate, full: Boolean, zone: ZoneId = ZoneId.systemDefault()): LocalDate =
        nextEvent(from.atStartOfDay(zone).toInstant(), full).atZone(zone).toLocalDate()
}
