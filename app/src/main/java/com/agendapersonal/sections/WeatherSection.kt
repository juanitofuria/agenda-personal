package com.agendapersonal.sections

import android.content.Context
import com.agendapersonal.data.Prefs
import com.agendapersonal.net.Http
import org.json.JSONObject
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.Locale

/** Tiempo hora a hora + lluvia de ayer y acumulada del año (Open-Meteo, sin API key). */
object WeatherSection : Section {
    override val id = "weather"
    override val title = "Tiempo"
    override val description = "Previsión por horas de tu zona, lluvia de ayer y acumulada del año"
    override val defaultHour = 7
    override val defaultMinute = 0
    override val emoji = "🌤️"
    override val accent = 0xFF0284C7.toInt()

    override suspend fun build(context: Context): Digest {
        val prefs = Prefs(context)
        val lat = prefs.latitude
        val lon = prefs.longitude
        val place = prefs.placeName
        val b = DigestBuilder()
        var summary = "Previsión para $place"
        val preview = mutableListOf<String>()
        var tMinD = 0.0; var tMaxD = 0.0; var codeD = 0
        var hoursD = emptyList<HourPoint>()
        var rainY: Double? = null; var rainYr: Double? = null

        b.part("Previsión") {
            val url = "https://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lon" +
                "&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m" +
                "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code" +
                "&timezone=auto&forecast_days=2"
            val json = JSONObject(Http.get(url))
            val daily = json.getJSONObject("daily")
            val tMax = daily.getJSONArray("temperature_2m_max").getDouble(0)
            val tMin = daily.getJSONArray("temperature_2m_min").getDouble(0)
            val rain = daily.getJSONArray("precipitation_sum").optDouble(0, 0.0)
            val code = daily.getJSONArray("weather_code").optInt(0)
            tMinD = tMin; tMaxD = tMax; codeD = code
            summary = "${emoji(code)} ${describe(code)}, ${fmt(tMin)}º/${fmt(tMax)}º" +
                if (rain >= 0.1) " · lluvia ${fmt(rain)} mm" else ""

            val h = json.getJSONObject("hourly")
            val times = h.getJSONArray("time")
            val temp = h.getJSONArray("temperature_2m")
            val prob = h.getJSONArray("precipitation_probability")
            val precip = h.getJSONArray("precipitation")
            val codes = h.getJSONArray("weather_code")
            val wind = h.getJSONArray("wind_speed_10m")
            val now = LocalDateTime.now()
            val nowHour = now.withMinute(0).withSecond(0).withNano(0)
            hoursD = (0 until times.length()).filter { !LocalDateTime.parse(times.getString(it)).isBefore(nowHour) }.take(18).map {
                HourPoint(LocalDateTime.parse(times.getString(it)).hour, temp.optDouble(it), codes.optInt(it), prob.optInt(it, 0), precip.optDouble(it, 0.0), wind.optDouble(it, 0.0))
            }
            val upcoming = (0 until times.length()).filter { !LocalDateTime.parse(times.getString(it)).isBefore(now.withMinute(0).withSecond(0).withNano(0)) }
            preview += "${emoji(code)} ${describe(code).replaceFirstChar { it.uppercase() }} · ${fmt(tMin)}º / ${fmt(tMax)}º"
            val slots = upcoming.filterIndexed { i, _ -> i % 3 == 0 }.take(4)
            if (slots.isNotEmpty()) preview += "⏰ " + slots.joinToString(" · ") {
                "%dh %s%sº".format(LocalDateTime.parse(times.getString(it)).hour, emoji(codes.optInt(it)), fmt(temp.optDouble(it)))
            }
            val sb = StringBuilder("🌤️ $place · hoy\nMáx ${fmt(tMax)}º · mín ${fmt(tMin)}º · ${describe(code)}\n")
            for (i in 0 until times.length()) {
                val t = LocalDateTime.parse(times.getString(i))
                // Desde la hora actual en adelante (si es de madrugada, todo el día).
                if (t.isBefore(now.withMinute(0).withSecond(0).withNano(0)) || t.toLocalDate() != now.toLocalDate()) continue
                sb.append(
                    "\n%02d:00  %s %sº  💧%d%%  %s mm  💨%s km/h".format(
                        t.hour, emoji(codes.optInt(i)), fmt(temp.optDouble(i)),
                        prob.optInt(i, 0), fmt(precip.optDouble(i, 0.0)), fmt(wind.optDouble(i, 0.0)),
                    )
                )
            }
            sb.toString()
        }

        b.part("Lluvia") {
            val today = LocalDate.now()
            val yesterday = today.minusDays(1)
            val yearStart = LocalDate.of(today.year, 1, 1)
            if (yesterday.isBefore(yearStart)) {
                preview += "🌧️ Año nuevo · acumulado 0 l/m²"
                "🌧️ Lluvia: año nuevo, acumulado 0 mm."
            } else {
                // Historical Forecast API: sin retraso, valores de modelo (no de pluviómetro).
                val url = "https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lon" +
                    "&start_date=$yearStart&end_date=$yesterday&daily=precipitation_sum&timezone=auto"
                val arr = JSONObject(Http.get(url)).getJSONObject("daily").getJSONArray("precipitation_sum")
                val values = (0 until arr.length()).map { if (arr.isNull(it)) 0.0 else arr.getDouble(it) }
                val yesterdayMm = values.lastOrNull() ?: 0.0
                val year = values.sum()
                rainY = yesterdayMm; rainYr = year
                val first = if (yesterdayMm >= 0.1) "Ayer llovió ${fmt(yesterdayMm)} l/m²." else "Ayer no llovió."
                preview += (if (yesterdayMm >= 0.1) "🌧️ Ayer ${fmt(yesterdayMm)} l/m²" else "☀️ Ayer sin lluvia") + " · Año ${fmt(year)} l/m²"
                "🌧️ $first\nAcumulado ${today.year}: ${fmt(year)} l/m² (desde el 1 de enero)."
            }
        }
        val extra = if (hoursD.isNotEmpty()) WeatherData(place, tMinD, tMaxD, codeD, hoursD, rainY, rainYr, LocalDate.now().year).toJson() else null
        return b.build("Tiempo · $place", summary, preview, extra)
    }

    private fun fmt(v: Double) = String.format(Locale("es", "ES"), "%.1f", v).removeSuffix(",0")

    private fun emoji(code: Int) = WeatherIcons.emoji(code)
    private fun describe(code: Int) = WeatherIcons.describe(code)
}
