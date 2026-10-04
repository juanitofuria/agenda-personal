package com.agendapersonal.sections

import android.content.Context
import com.agendapersonal.data.AppDb
import com.agendapersonal.data.Appointment
import com.agendapersonal.data.Prefs
import com.agendapersonal.data.Task
import com.agendapersonal.net.Place
import com.agendapersonal.notify.Scheduler
import java.time.LocalDate

/** Un tema que se puede elegir en la configuración inicial (cada uno crea una sección de noticias). */
data class Interest(val emoji: String, val label: String, val query: String)

object InterestCatalog {
    /** Secciones integradas que se pueden activar o no. */
    val builtIns = listOf(
        "weather" to ("🌤️" to "Tiempo"),
        "news" to ("📰" to "Noticias generales"),
        "markets" to ("📈" to "Bolsa y mercados"),
        "agenda" to ("🗓️" to "Mi agenda"),
        "horoscope" to ("🔮" to "Horóscopo"),
    )

    val topics = listOf(
        Interest("⚽", "Fútbol", "fútbol"),
        Interest("🏀", "Baloncesto", "baloncesto OR NBA OR ACB"),
        Interest("🏍️", "Motociclismo", "MotoGP OR motociclismo OR Superbike"),
        Interest("🏎️", "Fórmula 1", "Fórmula 1"),
        Interest("🎾", "Tenis", "tenis"),
        Interest("🚴", "Ciclismo", "ciclismo"),
        Interest("💻", "Tecnología", "tecnología novedades"),
        Interest("🎮", "Videojuegos", "videojuegos"),
        Interest("🎬", "Cine y series", "cine OR series estrenos"),
        Interest("🎵", "Música", "música conciertos"),
        Interest("🍳", "Cocina", "recetas cocina"),
        Interest("✈️", "Viajes", "viajes turismo"),
        Interest("🧘", "Salud y bienestar", "salud bienestar"),
        Interest("🔬", "Ciencia", "ciencia descubrimiento"),
        Interest("🌿", "Naturaleza", "naturaleza medio ambiente"),
        Interest("🚗", "Motor", "coches motor novedades"),
        Interest("🛡️", "Ciberseguridad", "ciberseguridad"),
        Interest("₿", "Criptomonedas", "bitcoin criptomonedas"),
        Interest("📚", "Libros", "libros literatura"),
        Interest("🏛️", "Política", "política"),
        Interest("🎨", "Cultura y arte", "cultura exposiciones"),
        Interest("🏡", "Vivienda", "vivienda alquiler precios"),
        Interest("🐶", "Mascotas", "mascotas"),
    )
}

/** Lo que el usuario ha ido indicando en la configuración inicial. */
data class OnboardingChoices(
    val name: String = "",
    val birth: LocalDate? = null,
    val place: Place? = null,
    /** Ids de secciones integradas elegidas (solo se aplican si [interestsChosen]). */
    val builtIns: Set<String> = emptySet(),
    val topics: Set<String> = emptySet(),          // etiquetas de InterestCatalog.topics
    val extraTopics: List<String> = emptyList(),   // intereses escritos a mano
    val interestsChosen: Boolean = false,
    val taskTitle: String = "",
    val apptTitle: String = "",
    val apptAt: Long? = null,
)

object Onboarding {
    /** Aplica las elecciones: ajustes, secciones, primeras tareas/citas y alarmas. Omitir = llamar con valores por defecto. */
    suspend fun apply(context: Context, c: OnboardingChoices) {
        val prefs = Prefs(context)
        if (c.name.isNotBlank()) prefs.userName = c.name.trim()
        c.birth?.let { prefs.birthDate = it.toString() }
        c.place?.let {
            prefs.placeName = it.name; prefs.latitude = it.lat; prefs.longitude = it.lon
            prefs.province = it.province; prefs.councils = it.name
        }

        if (c.interestsChosen) {
            InterestCatalog.builtIns.forEach { (id, _) -> prefs.setEnabled(id, id in c.builtIns) }
        }
        // El horóscopo necesita la fecha de nacimiento: si se da, se activa; si no, queda desactivado.
        if (c.birth != null && (!c.interestsChosen || "horoscope" in c.builtIns)) prefs.setEnabled("horoscope", true)
        if (c.birth == null && c.interestsChosen) prefs.setEnabled("horoscope", false)

        InterestCatalog.topics.filter { it.label in c.topics }.forEach { CustomTopics.add(prefs, it.label, it.query, it.emoji) }
        c.extraTopics.map { it.trim() }.filter { it.isNotEmpty() }.forEach { CustomTopics.add(prefs, it.replaceFirstChar { ch -> ch.uppercase() }, it) }

        val db = AppDb.get(context)
        if (c.taskTitle.isNotBlank()) {
            val t = Task(title = c.taskTitle.trim())
            db.tasks().insert(t)
        }
        if (c.apptTitle.isNotBlank() && c.apptAt != null) {
            val a = Appointment(title = c.apptTitle.trim(), at = c.apptAt)
            Scheduler.scheduleAppointment(context, a.copy(id = db.appointments().insert(a)))
        }

        prefs.onboarded = true
        Scheduler.rescheduleAll(context)
    }

    /** Omitir: se queda con lo que ya hubiera por defecto y entra en la pantalla principal. */
    suspend fun skip(context: Context, partial: OnboardingChoices = OnboardingChoices()) = apply(context, partial)
}
