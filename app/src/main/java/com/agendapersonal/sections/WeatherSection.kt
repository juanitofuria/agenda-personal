package com.agendapersonal.sections

import android.content.Context
import com.agendapersonal.data.Prefs
import com.agendapersonal.net.Http
import org.json.JSONObject
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.Locale

/**
 * Tiempo de tu zona (Open-Meteo, sin API key): previsión horaria, lluvia esperada, sol, viento, humedad, UV y radiación,
 * más la lluvia de ayer y la acumulada del año.
 */
object WeatherSection : Section {
    override val id = "weather"
    override val title = "Tiempo"
    override val description = "Previsión por horas, lluvia, sol, viento, humedad, UV y luna"
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
        var headline: String? = null
        var slotsLine: String? = null
        var sunWindLine: String? = null
        var pastRainLine: String? = null
        var data: WeatherData? = null
        var rainY: Double? = null; var rainYr: Double? = null

        b.part("Previsión") {
            val url = "https://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lon" +
                "&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m," +
                "relative_humidity_2m,uv_index,shortwave_radiation,wind_gusts_10m,wind_direction_10m" +
                "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,sunrise,sunset," +
                "uv_index_max,shortwave_radiation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant" +
                "&timezone=auto&forecast_days=2"
            val json = JSONObject(Http.get(url))
            val daily = json.getJSONObject("daily")
            val tMax = daily.getJSONArray("temperature_2m_max").getDouble(0)
            val tMin = daily.getJSONArray("temperature_2m_min").getDouble(0)
            val rain = daily.getJSONArray("precipitation_sum").optDouble(0, 0.0)
            val code = daily.getJSONArray("weather_code").optInt(0)
            summary = "${emoji(code)} ${describe(code)}, ${fmt(tMin)}º/${fmt(tMax)}º" +
                if (rain >= 0.1) " · lluvia ${fmt(rain)} mm" else ""
            headline = "${emoji(code)} ${describe(code).replaceFirstChar { it.uppercase() }} · ${fmt(tMin)}º / ${fmt(tMax)}º"

            val h = json.getJSONObject("hourly")
            val times = h.getJSONArray("time")
            val temp = h.getJSONArray("temperature_2m")
            val prob = h.getJSONArray("precipitation_probability")
            val precip = h.getJSONArray("precipitation")
            val codes = h.getJSONArray("weather_code")
            val wind = h.getJSONArray("wind_speed_10m")
            val hum = h.getJSONArray("relative_humidity_2m")
            val uv = h.getJSONArray("uv_index")
            val rad = h.getJSONArray("shortwave_radiation")
            val gust = h.getJSONArray("wind_gusts_10m")
            val dir = h.getJSONArray("wind_direction_10m")
            val now = LocalDateTime.now()
            val nowHour = now.withMinute(0).withSecond(0).withNano(0)
            val upcoming = (0 until times.length()).filter { !LocalDateTime.parse(times.getString(it)).isBefore(nowHour) }
            val points = upcoming.take(18).map {
                HourPoint(
                    LocalDateTime.parse(times.getString(it)).hour, temp.optDouble(it), codes.optInt(it), prob.optInt(it, 0),
                    precip.optDouble(it, 0.0), wind.optDouble(it, 0.0), hum.optInt(it, 0), uv.optDouble(it, 0.0),
                    rad.optDouble(it, 0.0), gust.optDouble(it, 0.0), dir.optInt(it, 0),
                )
            }
            val slots = upcoming.filterIndexed { i, _ -> i % 3 == 0 }.take(4)
            if (slots.isNotEmpty()) slotsLine = "⏰ " + slots.joinToString(" · ") {
                "%dh %s%sº".format(LocalDateTime.parse(times.getString(it)).hour, emoji(codes.optInt(it)), fmt(temp.optDouble(it)))
            }

            fun clock(arr: org.json.JSONArray) = arr.optString(0).substringAfter('T', "")
            val wd = WeatherData(
                place, tMin, tMax, code, points,
                sunrise = clock(daily.getJSONArray("sunrise")), sunset = clock(daily.getJSONArray("sunset")),
                uvMax = daily.getJSONArray("uv_index_max").optDouble(0, 0.0),
                radiationSum = daily.getJSONArray("shortwave_radiation_sum").optDouble(0, 0.0),
                windMax = daily.getJSONArray("wind_speed_10m_max").optDouble(0, 0.0),
                gustMax = daily.getJSONArray("wind_gusts_10m_max").optDouble(0, 0.0),
                windDir = daily.getJSONArray("wind_direction_10m_dominant").optInt(0, 0),
            )
            data = wd
            sunWindLine = "🌅 ${wd.sunrise} · 🌇 ${wd.sunset} · 💨 ${fmt(wd.windMax)} km/h ${WeatherData.compass(wd.windDir)} · ☀️ UV ${fmt(wd.uvMax)}"

            val sb = StringBuilder("🌤️ $place · hoy\nMáx ${fmt(tMax)}º · mín ${fmt(tMin)}º · ${describe(code)}\n")
            for (i in 0 until times.length()) {
                val t = LocalDateTime.parse(times.getString(i))
                if (t.isBefore(nowHour) || t.toLocalDate() != now.toLocalDate()) continue
                sb.append(
                    "\n%02d:00  %s %sº  💧%d%%  %s mm  💨%s km/h".format(
                        t.hour, emoji(codes.optInt(i)), fmt(temp.optDouble(i)),
                        prob.optInt(i, 0), fmt(precip.optDouble(i, 0.0)), fmt(wind.optDouble(i, 0.0)),
                    )
                )
            }
            sb.append("\n\n🌦️ ${wd.rainOutlook()}")
            wd.rainWindows().forEach { sb.append("\n• ${WeatherData.rainText(it)}") }
            sb.append("\n\n🌅 Amanece ${wd.sunrise} · 🌇 anochece ${wd.sunset}")
            sb.append("\n💨 Viento hasta ${fmt(wd.windMax)} km/h (rachas ${fmt(wd.gustMax)}) del ${WeatherData.compass(wd.windDir)}")
            sb.append("\n☀️ Índice UV máx. ${fmt(wd.uvMax)} · radiación ${fmt(wd.radiationSum)} MJ/m²")
            val moon = MoonPhase.phase(LocalDate.now())
            sb.append("\n${moon.emoji} ${moon.name} · ${(MoonPhase.illumination(LocalDate.now()) * 100).toInt()} % iluminada")
            sb.toString()
        }

        b.part("Lluvia") {
            val today = LocalDate.now()
            val yesterday = today.minusDays(1)
            val yearStart = LocalDate.of(today.year, 1, 1)
            if (yesterday.isBefore(yearStart)) {
                pastRainLine = "🌧️ Año nuevo · acumulado 0 l/m²"
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
                pastRainLine = (if (yesterdayMm >= 0.1) "🌧️ Ayer ${fmt(yesterdayMm)} l/m²" else "☀️ Ayer sin lluvia") + " · Año ${fmt(year)} l/m²"
                "🌧️ $first\nAcumulado ${today.year}: ${fmt(year)} l/m² (desde el 1 de enero)."
            }
        }

        val wd = data?.copy(rainYesterday = rainY, rainYear = rainYr, year = LocalDate.now().year)
        val preview = listOfNotNull(headline, slotsLine, wd?.let { "🌦️ ${it.rainOutlook()}" }, sunWindLine, pastRainLine)
        return b.build("Tiempo · $place", summary, preview, wd?.toJson())
    }

    private fun fmt(v: Double) = String.format(Locale("es", "ES"), "%.1f", v).removeSuffix(",0")

    private fun emoji(code: Int) = WeatherIcons.emoji(code)
    private fun describe(code: Int) = WeatherIcons.describe(code)
}
