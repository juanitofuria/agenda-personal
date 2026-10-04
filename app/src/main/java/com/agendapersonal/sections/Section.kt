package com.agendapersonal.sections

import android.content.Context

/** Resultado de una sección: texto corto para la notificación y texto completo para la app. */
data class Digest(
    val title: String,
    val summary: String,
    val body: String,
    /** false si no se pudo obtener ningún dato (p. ej. sin conexión): se reintentará. */
    val ok: Boolean = true,
)

/**
 * Una "sección" de la agenda: un bloque de información que se genera y se notifica a la hora elegida.
 * Para añadir una nueva: implementa esta interfaz y regístrala en [SectionRegistry].
 */
interface Section {
    val id: String
    val title: String
    val description: String
    val defaultHour: Int
    val defaultMinute: Int

    /** Requiere conexión a Internet (si falla, el trabajo se reintenta). */
    val needsNetwork: Boolean get() = true

    suspend fun build(context: Context): Digest
}

/** Ayuda para construir secciones con varias fuentes tolerando fallos parciales. */
class DigestBuilder {
    private val parts = mutableListOf<String>()
    private var succeeded = 0
    private var attempted = 0

    suspend fun part(name: String, block: suspend () -> String?) {
        attempted++
        val text = runCatching { block() }.getOrElse {
            parts += "⚠️ $name: no disponible (${it.message?.take(60) ?: it.javaClass.simpleName})"
            return
        }
        succeeded++
        if (!text.isNullOrBlank()) parts += text
    }

    fun build(title: String, summary: String): Digest = Digest(
        title = title,
        summary = summary,
        body = parts.joinToString("\n\n"),
        ok = attempted == 0 || succeeded > 0,
    )
}
