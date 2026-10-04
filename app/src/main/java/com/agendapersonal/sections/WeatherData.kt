package com.agendapersonal.sections

import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

/** Un punto de la previsión horaria. */
data class HourPoint(
    val hour: Int, val temp: Double, val code: Int, val prob: Int, val mm: Double, val wind: Double,
    val humidity: Int = 0, val uv: Double = 0.0, val radiation: Double = 0.0, val gust: Double = 0.0, val windDir: Int = 0,
)

/** Tramo de lluvia prevista: de [fromHour] a [toHour] (exclusivo), con acumulado estimado y probabilidad máxima. */
data class RainWindow(val fromHour: Int, val toHour: Int, val mm: Double, val maxProb: Int)

/** Datos estructurados del tiempo: alimentan la gráfica y el detalle (se guardan junto al resumen). */
data class WeatherData(
    val place: String,
    val tMin: Double,
    val tMax: Double,
    val code: Int,
    val hours: List<HourPoint>,
    val rainYesterday: Double? = null,
    val rainYear: Double? = null,
    val year: Int = 0,
    val sunrise: String = "",       // "HH:mm" hora local
    val sunset: String = "",
    val uvMax: Double = 0.0,
    val radiationSum: Double = 0.0, // MJ/m² del día
    val windMax: Double = 0.0,      // km/h
    val gustMax: Double = 0.0,
    val windDir: Int = 0,           // grados de procedencia del viento dominante
) {
    /** Tramos con lluvia esperada: horas seguidas con ≥0,1 mm o probabilidad ≥60 %. */
    fun rainWindows(): List<RainWindow> {
        val out = mutableListOf<RainWindow>()
        var start = -1
        fun wet(h: HourPoint) = h.mm >= 0.1 || h.prob >= 60
        fun close(endExclusive: Int) {
            if (start < 0) return
            val slice = hours.subList(start, endExclusive)
            out += RainWindow(slice.first().hour, (slice.last().hour + 1) % 24, slice.sumOf { it.mm }, slice.maxOf { it.prob })
            start = -1
        }
        hours.forEachIndexed { i, h -> if (wet(h)) { if (start < 0) start = i } else close(i) }
        close(hours.size)
        return out
    }

    /** Frase corta sobre la lluvia esperada, p. ej. "Lluvia 17–21 h · ~3,2 l/m² · prob. 76 %". */
    fun rainOutlook(): String {
        val w = rainWindows()
        if (w.isEmpty()) return "Sin lluvia prevista en las próximas ${hours.size} h"
        return "Lluvia " + w.joinToString(" y ") { rainText(it) }
    }

    companion object {
        fun rainText(w: RainWindow): String {
            val mm = if (w.mm >= 0.1) " · ~${String.format(Locale("es", "ES"), "%.1f", w.mm).removeSuffix(",0")} l/m²" else " · sin acumulación notable"
            return "%02d–%02d h%s · prob. %d %%".format(w.fromHour, w.toHour, mm, w.maxProb)
        }

        fun compass(deg: Int): String =
            listOf("N", "NE", "E", "SE", "S", "SO", "O", "NO")[((deg % 360 + 360) % 360 / 45.0 + 0.5).toInt() % 8]

        fun fromJson(raw: String?): WeatherData? = runCatching {
            val j = JSONObject(raw ?: return null)
            val arr = j.getJSONArray("hours")
            WeatherData(
                j.getString("place"), j.getDouble("tMin"), j.getDouble("tMax"), j.getInt("code"),
                (0 until arr.length()).map {
                    val o = arr.getJSONObject(it)
                    HourPoint(
                        o.getInt("h"), o.getDouble("t"), o.getInt("c"), o.getInt("p"), o.getDouble("r"), o.getDouble("w"),
                        o.optInt("hu"), o.optDouble("uv", 0.0), o.optDouble("ra", 0.0), o.optDouble("g", 0.0), o.optInt("d"),
                    )
                },
                if (j.has("rainYesterday")) j.getDouble("rainYesterday") else null,
                if (j.has("rainYear")) j.getDouble("rainYear") else null,
                j.optInt("year"), j.optString("sunrise"), j.optString("sunset"),
                j.optDouble("uvMax", 0.0), j.optDouble("radSum", 0.0), j.optDouble("windMax", 0.0), j.optDouble("gustMax", 0.0), j.optInt("windDir"),
            )
        }.getOrNull()
    }

    fun toJson(): String = JSONObject()
        .put("place", place).put("tMin", tMin).put("tMax", tMax).put("code", code).put("year", year)
        .put("sunrise", sunrise).put("sunset", sunset).put("uvMax", uvMax).put("radSum", radiationSum)
        .put("windMax", windMax).put("gustMax", gustMax).put("windDir", windDir)
        .apply {
            rainYesterday?.let { put("rainYesterday", it) }
            rainYear?.let { put("rainYear", it) }
        }
        .put("hours", JSONArray(hours.map {
            JSONObject().put("h", it.hour).put("t", it.temp).put("c", it.code).put("p", it.prob).put("r", it.mm).put("w", it.wind)
                .put("hu", it.humidity).put("uv", it.uv).put("ra", it.radiation).put("g", it.gust).put("d", it.windDir)
        }))
        .toString()
}

object WeatherIcons {
    fun emoji(code: Int) = when (code) {
        0 -> "☀️"; 1, 2 -> "🌤️"; 3 -> "☁️"; 45, 48 -> "🌫️"
        in 51..57 -> "🌦️"; in 61..67 -> "🌧️"; in 71..77 -> "❄️"
        in 80..82 -> "🌧️"; 85, 86 -> "🌨️"; in 95..99 -> "⛈️"; else -> "🌡️"
    }

    fun describe(code: Int) = when (code) {
        0 -> "despejado"; 1 -> "poco nuboso"; 2 -> "parcialmente nuboso"; 3 -> "cubierto"
        45, 48 -> "niebla"; in 51..57 -> "llovizna"; in 61..65 -> "lluvia"; 66, 67 -> "lluvia helada"
        in 71..77 -> "nieve"; in 80..82 -> "chubascos"; 85, 86 -> "chubascos de nieve"
        95 -> "tormenta"; 96, 99 -> "tormenta con granizo"; else -> "variable"
    }
}
