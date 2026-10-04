package com.agendapersonal.sections

import android.content.Context
import com.agendapersonal.data.Prefs

/** Lista de secciones de la app: las integradas más las personalizadas que el usuario haya creado. */
object SectionRegistry {
    private val builtIn: List<Section> = listOf(
        WeatherSection,
        NewsSection,
        AgendaSection,
        MarketsSection,
        HoroscopeSection,
        // Para añadir una sección integrada nueva: impleméntala y regístrala aquí.
    )

    @Volatile private var app: Context? = null
    private var cachedRaw: String? = null
    private var cachedCustom: List<Section> = emptyList()

    fun init(context: Context) { app = context.applicationContext }

    val all: List<Section>
        get() = builtIn + custom()

    private fun custom(): List<Section> {
        val ctx = app ?: return emptyList()
        val raw = Prefs(ctx).customTopicsJson
        synchronized(this) {
            if (raw != cachedRaw) { cachedCustom = CustomTopics.parse(raw).map(::TopicSection); cachedRaw = raw }
            return cachedCustom
        }
    }

    fun byId(id: String): Section? = all.firstOrNull { it.id == id }
}
