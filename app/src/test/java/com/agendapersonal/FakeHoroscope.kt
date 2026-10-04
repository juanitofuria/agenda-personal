package com.agendapersonal

import com.agendapersonal.sections.HoroscopeSection
import com.agendapersonal.sections.HoroscopeSource
import com.agendapersonal.sections.HoroscopoDoc
import java.time.LocalDate

/** Origen de horóscopo de prueba: devuelve un documento con el aspecto de los que escribe la Cloud Function. */
object FakeHoroscope {
    val doc = HoroscopoDoc(
        signo = "aries", fecha = LocalDate.now().toString(),
        prediccion = "Hoy es un buen día para tomar la iniciativa en asuntos pendientes. Alguien cercano valorará tu sinceridad y una conversación inesperada te dará una buena idea. Evita las decisiones precipitadas por la tarde y reserva un rato para ti.",
        idioma = "es", animo = "Optimista", color = "Turquesa", numeroSuerte = "17", horaSuerte = "10:00", compatibilidad = "Libra",
        fuente = "Aztro (astrology.kudosmedia.net)",
    )

    fun install(d: HoroscopoDoc? = doc) {
        HoroscopeSection.sourceProvider = { object : HoroscopeSource { override suspend fun obtenerHoroscopoDiario(signoId: String) = d } }
    }
}
