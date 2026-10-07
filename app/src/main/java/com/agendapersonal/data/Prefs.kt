package com.agendapersonal.data

import android.content.Context

/** Ajustes del usuario (SharedPreferences). */
class Prefs(context: Context) {
    private val sp = context.applicationContext.getSharedPreferences("agenda", Context.MODE_PRIVATE)
    fun isEnabled(id: String, default: Boolean = true) = sp.getBoolean("en_$id", default)
    fun setEnabled(id: String, value: Boolean) = sp.edit().putBoolean("en_$id", value).apply()
    fun hour(id: String, default: Int) = sp.getInt("h_$id", default)
    fun minute(id: String, default: Int) = sp.getInt("m_$id", default)
    fun setTime(id: String, hour: Int, minute: Int) = sp.edit().putInt("h_$id", hour).putInt("m_$id", minute).apply()
    fun lastDigest(id: String): String? = sp.getString("last_$id", null)
    fun setLastDigest(id: String, text: String) = sp.edit().putString("last_$id", text).apply()
    fun isEnabled(section: com.agendapersonal.sections.Section) = sp.getBoolean("en_${section.id}", section.defaultEnabled)

    var onboarded: Boolean
        get() = sp.getBoolean("onboarded", false)
        set(v) = sp.edit().putBoolean("onboarded", v).apply()
    var userName: String
        get() = sp.getString("user_name", "") ?: ""
        set(v) = sp.edit().putString("user_name", v).apply()
    var birthDate: String
        get() = sp.getString("birth_date", "") ?: ""
        set(v) = sp.edit().putString("birth_date", v).apply()
    var customTopicsJson: String
        get() = sp.getString("custom_topics", "[]") ?: "[]"
        set(v) = sp.edit().putString("custom_topics", v).apply()
    var placeName: String
        get() = sp.getString("place_name", "Montoro") ?: "Montoro"
        set(v) = sp.edit().putString("place_name", v).apply()
    var latitude: Double
        get() = sp.getFloat("lat", 38.0227f).toDouble()
        set(v) = sp.edit().putFloat("lat", v.toFloat()).apply()
    var longitude: Double
        get() = sp.getFloat("lon", -4.3856f).toDouble()
        set(v) = sp.edit().putFloat("lon", v.toFloat()).apply()
    var province: String
        get() = sp.getString("province", "Córdoba") ?: "Córdoba"
        set(v) = sp.edit().putString("province", v).apply()
    var councils: String
        get() = sp.getString("councils", "Montoro\nCórdoba") ?: "Montoro\nCórdoba"
        set(v) = sp.edit().putString("councils", v).apply()
    var watchTerms: String
        get() = sp.getString("watch_terms", "") ?: ""
        set(v) = sp.edit().putString("watch_terms", v).apply()
    var customFeeds: String
        get() = sp.getString("custom_feeds", "") ?: ""
        set(v) = sp.edit().putString("custom_feeds", v).apply()
    var notificationSound: String
        get() = sp.getString("notification_sound", "signature") ?: "signature"
        set(v) = sp.edit().putString("notification_sound", v).apply()
    fun lines(raw: String) = raw.lines().map { it.trim() }.filter { it.isNotEmpty() }
}
