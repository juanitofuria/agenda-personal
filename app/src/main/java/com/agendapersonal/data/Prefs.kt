package com.agendapersonal.data

import android.content.Context

/** Ajustes del usuario (SharedPreferences). */
class Prefs(context: Context) {
    private val sp = context.applicationContext.getSharedPreferences("agenda", Context.MODE_PRIVATE)

    // ---- Secciones ----
    fun isEnabled(id: String, default: Boolean = true) = sp.getBoolean("en_$id", default)
    fun setEnabled(id: String, value: Boolean) = sp.edit().putBoolean("en_$id", value).apply()

    fun hour(id: String, default: Int) = sp.getInt("h_$id", default)
    fun minute(id: String, default: Int) = sp.getInt("m_$id", default)
    fun setTime(id: String, hour: Int, minute: Int) =
        sp.edit().putInt("h_$id", hour).putInt("m_$id", minute).apply()

    fun lastDigest(id: String): String? = sp.getString("last_$id", null)
    fun setLastDigest(id: String, text: String) = sp.edit().putString("last_$id", text).apply()

    // ---- Ubicación (para el tiempo) ----
    var placeName: String
        get() = sp.getString("place_name", "Montoro") ?: "Montoro"
        set(v) = sp.edit().putString("place_name", v).apply()
    var latitude: Double
        get() = sp.getFloat("lat", 38.0227f).toDouble()
        set(v) = sp.edit().putFloat("lat", v.toFloat()).apply()
    var longitude: Double
        get() = sp.getFloat("lon", -4.3856f).toDouble()
        set(v) = sp.edit().putFloat("lon", v.toFloat()).apply()

    // ---- Noticias locales ----
    var province: String
        get() = sp.getString("province", "Córdoba") ?: "Córdoba"
        set(v) = sp.edit().putString("province", v).apply()
    /** Ayuntamientos/municipios a seguir (uno por línea). Por defecto Montoro y Córdoba. */
    var councils: String
        get() = sp.getString("councils", "Montoro\nCórdoba") ?: "Montoro\nCórdoba"
        set(v) = sp.edit().putString("councils", v).apply()

    /** Nombres o palabras clave a vigilar (políticos locales, asociaciones...), una por línea. */
    var watchTerms: String
        get() = sp.getString("watch_terms", "") ?: ""
        set(v) = sp.edit().putString("watch_terms", v).apply()

    /** Feeds RSS propios (periódicos locales, RSSHub/Nitter para redes sociales...), uno por línea. */
    var customFeeds: String
        get() = sp.getString("custom_feeds", "") ?: ""
        set(v) = sp.edit().putString("custom_feeds", v).apply()

    fun lines(raw: String) = raw.lines().map { it.trim() }.filter { it.isNotEmpty() }
}
