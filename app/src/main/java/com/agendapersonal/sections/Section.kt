package com.agendapersonal.sections

import android.content.Context

/** Resultado de una sección: texto corto para la notificación y texto completo para la app. */
data class Digest(
    val title: String,
    val summary: String,
    val body: String,
    /** Titulares cortos (máx. 6 líneas) para la tarjeta de inicio y la notificación. */
    val preview: List<String> = emptyList(),
    /** Datos estructurados opcionales (JSON) para vistas especiales, p. ej. la gráfica del tiempo. */
    val extra: String? = null,
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

    /** Emoji y color de acento (ARGB) usados en las notificaciones. */
    val emoji: String get() = "🔔"
    val accent: Int get() = 0xFF3B5BDB.toInt()

    /** Requiere conexión a Internet (si falla, el trabajo se reintenta). */
    val needsNetwork: Boolean get() = true

    suspend fun build(context: Context): Digest
}

/** Ayuda para construir secciones con varias fuentes tolerando fallos parciales. */
class DigestBuilder(private val retryDelayMs: Long = 1500) {
    private val RETRY_DELAY_MS get() = retryDelayMs
    private companion object { const val ATTEMPTS = 3 }
    private val parts = mutableListOf<String>()
    private var succeeded = 0
    private var attempted = 0

    /** Cada fuente se reintenta (red móvil inestable) antes de darla por perdida. */
    suspend fun part(name: String, block: suspend () -> String?) {
        attempted++
        var last: Throwable? = null
        repeat(ATTEMPTS) { attempt ->
            val result = runCatching { block() }
            if (result.isSuccess) {
                succeeded++
                result.getOrNull()?.takeIf { it.isNotBlank() }?.let { parts += it }
                return
            }
            last = result.exceptionOrNull()
            if (last is kotlinx.coroutines.CancellationException) throw last!!
            if (attempt < ATTEMPTS - 1) kotlinx.coroutines.delay(RETRY_DELAY_MS)
        }
        parts += "⚠️ $name: no disponible (${last?.message?.take(60) ?: last?.javaClass?.simpleName})"
    }

    fun build(title: String, summary: String, preview: List<String> = emptyList(), extra: String? = null): Digest = Digest(
        title = title,
        summary = summary,
        body = parts.joinToString("\n\n"),
        preview = preview.take(6),
        extra = extra,
        ok = attempted == 0 || succeeded > 0,
    )
}
