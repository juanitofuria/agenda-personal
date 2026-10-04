package com.agendapersonal.net

import org.json.JSONObject

data class Place(val name: String, val admin1: String, val admin2: String, val country: String, val lat: Double, val lon: Double) {
    /** Provincia (o región si no hay provincia), sin el prefijo "Provincia de". */
    val province: String get() = admin2.removePrefix("Provincia de ").ifBlank { admin1 }
    val label: String get() = listOf(name, admin2, admin1, country).filter { it.isNotBlank() }.joinToString(", ")
}

object Geocoding {
    suspend fun search(query: String): List<Place> {
        val json = JSONObject(Http.get("https://geocoding-api.open-meteo.com/v1/search?name=${Http.enc(query)}&count=6&language=es&format=json"))
        val arr = json.optJSONArray("results") ?: return emptyList()
        return (0 until arr.length()).map {
            val o = arr.getJSONObject(it)
            Place(o.getString("name"), o.optString("admin1"), o.optString("admin2"), o.optString("country"), o.getDouble("latitude"), o.getDouble("longitude"))
        }
    }
}
