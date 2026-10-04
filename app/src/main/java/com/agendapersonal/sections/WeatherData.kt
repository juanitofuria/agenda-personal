package com.agendapersonal.sections

import org.json.JSONArray
import org.json.JSONObject

data class HourPoint(val hour: Int, val temp: Double, val code: Int, val prob: Int, val mm: Double, val wind: Double)

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
) {
    fun toJson(): String = JSONObject()
        .put("place", place).put("tMin", tMin).put("tMax", tMax).put("code", code).put("year", year)
        .apply {
            rainYesterday?.let { put("rainYesterday", it) }
            rainYear?.let { put("rainYear", it) }
        }
        .put("hours", JSONArray(hours.map {
            JSONObject().put("h", it.hour).put("t", it.temp).put("c", it.code).put("p", it.prob).put("r", it.mm).put("w", it.wind)
        }))
        .toString()

    companion object {
        fun fromJson(raw: String?): WeatherData? = runCatching {
            val j = JSONObject(raw ?: return null)
            val arr = j.getJSONArray("hours")
            WeatherData(
                j.getString("place"), j.getDouble("tMin"), j.getDouble("tMax"), j.getInt("code"),
                (0 until arr.length()).map {
                    val o = arr.getJSONObject(it)
                    HourPoint(o.getInt("h"), o.getDouble("t"), o.getInt("c"), o.getInt("p"), o.getDouble("r"), o.getDouble("w"))
                },
                if (j.has("rainYesterday")) j.getDouble("rainYesterday") else null,
                if (j.has("rainYear")) j.getDouble("rainYear") else null,
                j.optInt("year"),
            )
        }.getOrNull()
    }
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
