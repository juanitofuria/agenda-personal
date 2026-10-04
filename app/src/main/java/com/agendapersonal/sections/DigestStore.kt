package com.agendapersonal.sections

import android.content.Context
import com.agendapersonal.data.Prefs
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Date
import java.util.Locale

/** Último resumen guardado de una sección. */
data class Stored(val title: String, val summary: String, val preview: List<String>, val body: String, val at: Long)

/** Genera una sección y guarda el resultado como "último resumen" (lo usan la app y el worker). */
object DigestStore {
    fun save(context: Context, sectionId: String, digest: Digest) {
        val json = JSONObject()
            .put("title", digest.title).put("summary", digest.summary)
            .put("preview", JSONArray(digest.preview)).put("body", digest.body)
            .put("at", System.currentTimeMillis())
        Prefs(context).setLastDigest(sectionId, json.toString())
    }

    fun load(context: Context, sectionId: String): Stored? {
        val raw = Prefs(context).lastDigest(sectionId) ?: return null
        return runCatching {
            val j = JSONObject(raw)
            val arr = j.optJSONArray("preview")
            Stored(
                j.getString("title"), j.optString("summary"),
                (0 until (arr?.length() ?: 0)).map { arr!!.getString(it) },
                j.getString("body"), j.optLong("at"),
            )
        }.getOrNull() // formato antiguo (texto plano): se ignora y se vuelve a generar
    }

    /** Obtiene datos actualizados ahora mismo. Devuelve null si falla; solo guarda si hubo datos. */
    suspend fun refresh(context: Context, section: Section): Digest? {
        val digest = runCatching { section.build(context) }.getOrNull() ?: return null
        if (digest.ok) save(context, section.id, digest)
        return digest
    }

    /** "ahora", "hace 5 min", "hoy 07:00", "ayer 14:20", "3 oct 09:00". */
    fun relative(at: Long): String {
        val now = System.currentTimeMillis()
        val mins = (now - at) / 60_000
        val zone = ZoneId.systemDefault()
        val day = LocalDate.ofInstant(Instant.ofEpochMilli(at), zone)
        val hm = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(at))
        return when {
            mins < 1 -> "ahora"
            mins < 60 -> "hace $mins min"
            day == LocalDate.now() -> "hoy $hm"
            day == LocalDate.now().minusDays(1) -> "ayer $hm"
            else -> SimpleDateFormat("d MMM", Locale("es", "ES")).format(Date(at)) + " $hm"
        }
    }
}
