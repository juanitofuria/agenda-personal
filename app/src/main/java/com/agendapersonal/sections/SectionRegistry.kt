package com.agendapersonal.sections

/** Lista de secciones de la app. Añade aquí las nuevas. */
object SectionRegistry {
    val all: List<Section> = listOf(
        WeatherSection,
        NewsSection,
        AgendaSection,
        MarketsSection,
        // Ejemplo de una futura sección: NuevaSection,
    )

    fun byId(id: String): Section? = all.firstOrNull { it.id == id }
}
