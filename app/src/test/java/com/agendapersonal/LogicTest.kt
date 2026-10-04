package com.agendapersonal

import com.agendapersonal.sections.*
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@org.junit.runner.RunWith(org.robolectric.RobolectricTestRunner::class)
@org.robolectric.annotation.Config(sdk = [34])
class LogicTest {
    private fun minutesApart(a: java.time.Instant, b: java.time.Instant) = kotlin.math.abs(java.time.Duration.between(a, b).toMinutes())

    @Test fun moonEventsMatchKnownAstronomicalTimes() {
        // Fechas (UTC) de eclipses y lunas llenas/nuevas muy documentadas; se admiten 15 minutos de error.
        val known = listOf(
            "2024-04-08T18:21:00Z" to false, // luna nueva, eclipse solar total
            "2024-04-23T23:49:00Z" to true,
            "2024-05-08T03:22:00Z" to false,
            "2025-12-04T23:14:00Z" to true,  // superluna de diciembre
            "2026-03-03T11:38:00Z" to true,  // eclipse lunar total
            "2026-08-12T17:37:00Z" to false, // eclipse solar total
        )
        known.forEach { (iso, full) ->
            val expected = java.time.Instant.parse(iso)
            val found = MoonPhase.nextEvent(expected.minus(java.time.Duration.ofDays(3)), full)
            assertTrue("$iso (${if (full) "llena" else "nueva"}): calculada $found, ${minutesApart(expected, found)} min de diferencia", minutesApart(expected, found) <= 15)
        }
    }

    @Test fun moonPhasesOfTheDay() {
        val utc = java.time.ZoneOffset.UTC
        assertEquals("Luna nueva", MoonPhase.phase(LocalDate.of(2024, 4, 8), utc).name)
        assertEquals("Luna llena", MoonPhase.phase(LocalDate.of(2024, 4, 23), utc).name)
        assertEquals("Luna llena", MoonPhase.phase(LocalDate.of(2025, 12, 4), utc).name)
        assertTrue(MoonPhase.illumination(LocalDate.of(2024, 4, 23), utc) > 0.97)
        assertTrue(MoonPhase.illumination(LocalDate.of(2024, 4, 8), utc) < 0.03)
        // El calendario no repite la misma fase principal varios días seguidos.
        val april = (1..30).map { MoonPhase.phase(LocalDate.of(2024, 4, it), utc).name }
        assertEquals(1, april.count { it == "Luna llena" }); assertEquals(1, april.count { it == "Luna nueva" })
        assertEquals(1, april.count { it == "Cuarto creciente" }); assertEquals(1, april.count { it == "Cuarto menguante" })
        // Fases consecutivas en orden: nunca salta de creciente a menguante sin pasar por llena.
        val order = listOf("Luna nueva", "Luna creciente", "Cuarto creciente", "Gibosa creciente", "Luna llena", "Gibosa menguante", "Cuarto menguante", "Luna menguante")
        val idx = (1..60).map { order.indexOf(MoonPhase.phase(LocalDate.of(2024, 4, 1).plusDays(it.toLong()), utc).name) }
        idx.forEachIndexed { k, i -> if (k > 0) assertTrue("salto raro ${idx[k - 1]}→$i", (i - idx[k - 1] + 8) % 8 <= 2) }
        val nextFull = MoonPhase.next(LocalDate.of(2024, 4, 10), full = true, zone = utc)
        assertEquals(LocalDate.of(2024, 4, 23), nextFull)
        assertEquals(LocalDate.of(2024, 5, 8), MoonPhase.next(LocalDate.of(2024, 4, 10), full = false, zone = utc))
        // En hora de España la luna llena del 23-abr 23:49 UTC ya es el día 24.
        assertEquals(LocalDate.of(2024, 4, 24), MoonPhase.next(LocalDate.of(2024, 4, 10), full = true, zone = java.time.ZoneId.of("Europe/Madrid")))
    }

    @Test fun signsAtBoundaries() {
        fun s(m: Int, d: Int) = Sign.of(LocalDate.of(1990, m, d))
        assertEquals(Sign.ARIES, s(3, 21)); assertEquals(Sign.PISCES, s(3, 20)); assertEquals(Sign.TAURUS, s(4, 20))
        assertEquals(Sign.CAPRICORN, s(12, 22)); assertEquals(Sign.CAPRICORN, s(1, 19)); assertEquals(Sign.AQUARIUS, s(1, 20))
        assertEquals(Sign.LEO, s(8, 22)); assertEquals(Sign.VIRGO, s(8, 23)); assertEquals(Sign.SAGITTARIUS, s(12, 21))
        // los 12 signos aparecen a lo largo del año
        assertEquals(12, (0 until 366).map { Sign.of(LocalDate.of(2024, 1, 1).plusDays(it.toLong())) }.toSet().size)
    }

    @Test fun signIdsMatchFirestoreAndAztroNames() {
        assertEquals(listOf("aries", "tauro", "geminis", "cancer", "leo", "virgo", "libra", "escorpio", "sagitario", "capricornio", "acuario", "piscis"), Sign.entries.map { it.id })
        assertEquals(listOf("aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"), Sign.entries.map { it.aztro })
        assertTrue(Sign.entries.all { it.id == java.text.Normalizer.normalize(it.id, java.text.Normalizer.Form.NFD).replace(Regex("\\p{M}"), "") })
    }

    private fun hp(h: Int, mm: Double, prob: Int) = HourPoint(h, 20.0, 3, prob, mm, 5.0)

    @Test fun rainWindowsGroupConsecutiveWetHours() {
        val hours = listOf(hp(7, 0.0, 5), hp(8, 0.0, 10), hp(9, 0.3, 40), hp(10, 1.2, 80), hp(11, 0.4, 70), hp(12, 0.0, 20),
            hp(13, 0.0, 65), hp(14, 0.0, 10), hp(15, 0.0, 0))
        val d = WeatherData("X", 10.0, 20.0, 3, hours)
        val w = d.rainWindows()
        assertEquals(2, w.size)
        assertEquals(RainWindow(9, 12, 1.9, 80), w[0].copy(mm = Math.round(w[0].mm * 10) / 10.0))
        assertEquals(RainWindow(13, 14, 0.0, 65), w[1])
        assertTrue(d.rainOutlook().startsWith("Lluvia 09–12 h"))
        assertTrue(WeatherData("X", 1.0, 2.0, 0, hours.filter { it.prob < 20 }).rainOutlook().startsWith("Sin lluvia"))
    }

    @Test fun rainWindowAcrossMidnightAndAtEnd() {
        val d = WeatherData("X", 1.0, 2.0, 0, listOf(hp(22, 0.0, 0), hp(23, 0.5, 70), hp(0, 0.8, 90)))
        val w = d.rainWindows().single()
        assertEquals(23, w.fromHour); assertEquals(1, w.toHour)
    }

    @Test fun weatherJsonKeepsNewFieldsAndReadsOldFormat() {
        val d = WeatherData("Montoro", 15.0, 27.0, 2, listOf(HourPoint(8, 18.0, 1, 10, 0.0, 6.0, 70, 3.5, 410.0, 15.0, 225)),
            sunrise = "08:12", sunset = "19:40", uvMax = 5.2, radiationSum = 17.3, windMax = 21.0, gustMax = 38.0, windDir = 225)
        assertEquals(d, WeatherData.fromJson(d.toJson()))
        assertEquals("SO", WeatherData.compass(225)); assertEquals("N", WeatherData.compass(359)); assertEquals("E", WeatherData.compass(90))
        // formato anterior (sin campos nuevos)
        val old = """{"place":"X","tMin":1,"tMax":2,"code":3,"year":2026,"hours":[{"h":1,"t":2,"c":3,"p":4,"r":0,"w":5}]}"""
        val o = WeatherData.fromJson(old)!!
        assertEquals("", o.sunrise); assertEquals(0, o.hours[0].humidity)
    }

    @Test fun customTopicsRoundTripAndSlug() {
        assertEquals("ajedrez", CustomTopics.slug("Ajedrez"))
        assertEquals("musica-y-conciertos", CustomTopics.slug("Música y conciertos"))
        val list = listOf(CustomTopic("a", "A", "⭐", "q1"), CustomTopic("b", "B", "🎵", "q2 OR q3"))
        assertEquals(list, CustomTopics.parse(CustomTopics.toJson(list)))
        assertEquals(emptyList<CustomTopic>(), CustomTopics.parse("basura"))
    }
}
