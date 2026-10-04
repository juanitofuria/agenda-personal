package com.agendapersonal.sections

import android.content.Context
import com.agendapersonal.data.Prefs
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Genera una sección y guarda el resultado como "último resumen" (lo usan la app y el worker). */
object DigestStore {
    fun save(context: Context, sectionId: String, digest: Digest) {
        val stamp = SimpleDateFormat("d MMM HH:mm", Locale("es", "ES")).format(Date())
        Prefs(context).setLastDigest(sectionId, "${digest.title} · $stamp\n\n${digest.body}")
    }

    /** Obtiene datos actualizados ahora mismo. Devuelve null si falla; solo guarda si hubo datos. */
    suspend fun refresh(context: Context, section: Section): Digest? {
        val digest = runCatching { section.build(context) }.getOrNull() ?: return null
        if (digest.ok) save(context, section.id, digest)
        return digest
    }
}
